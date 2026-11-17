import "dotenv/config"
import { TZDate } from "@date-fns/tz"
import { addDays } from "date-fns"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/session", () => ({ requireAdmin: vi.fn() }))

import { prisma } from "../../src/lib/prisma"
import { requireAdmin } from "../../src/lib/session"
import { changeAppointmentStatus } from "../../src/features/agenda/status"
import { bookAppointment } from "../../src/features/booking/core"
import { getAreaBackgrounds } from "../../src/features/backgrounds/queries"
import { setMediaFocusAction, setPageMediaAction } from "../../src/features/backgrounds/actions"
import { saveWorkingHoursAction } from "../../src/features/availability/actions"
import { photoPosition } from "../../src/lib/media-focus"

describe.skipIf(!process.env.DATABASE_URL)("regressões da homologação", () => {
  const stamp = `${Date.now()}-${process.pid}`
  const timezone = "America/Sao_Paulo"
  let ownerId: string
  let businessId: string
  let clientId: string
  let serviceId: string
  let mediaId: string
  let startsAt: Date

  beforeAll(async () => {
    const owner = await prisma.user.create({ data: { name: "Admin homologação", role: "ADMIN" } })
    ownerId = owner.id
    const business = await prisma.business.create({
      data: {
        ownerId,
        name: "Estúdio teste",
        slug: `test-${stamp}`,
        codePrefix: `T-${stamp}`,
        timezone,
        workingHours: {
          create: Array.from({ length: 7 }, (_, weekday) => ({
            weekday,
            enabled: true,
            startMin: 540,
            endMin: 1140,
            breakStartMin: 720,
            breakEndMin: 780,
          })),
        },
      },
    })
    businessId = business.id
    clientId = (await prisma.user.create({ data: { name: "Cliente teste", role: "CLIENT" } })).id
    serviceId = (
      await prisma.service.create({
        data: {
          businessId,
          title: "Serviço teste",
          durationMin: 60,
          bufferMin: 15,
          priceCents: 5000,
          photoUrls: ["/uploads/test.jpg"],
          photoFocus: { "/uploads/test.jpg": { x: 70, y: 20 } },
        },
      })
    ).id
    mediaId = (
      await prisma.backgroundMedia.create({
        data: { businessId, name: "Fundo teste", kind: "IMAGE", url: "/uploads/test.jpg" },
      })
    ).id
    vi.mocked(requireAdmin).mockResolvedValue(owner)
    const future = new TZDate(addDays(new Date(), 10), timezone)
    startsAt = new TZDate(
      future.getFullYear(),
      future.getMonth(),
      future.getDate(),
      9,
      0,
      0,
      timezone,
    )
  })

  afterAll(async () => {
    if (businessId) await prisma.business.delete({ where: { id: businessId } })
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, clientId].filter(Boolean) } } })
    await prisma.$disconnect()
  })

  it("salva enquadramentos diferentes para desktop e celular", async () => {
    expect(await setMediaFocusAction(mediaId, 30, 20, 80, 60)).toHaveProperty("success")
    await setPageMediaAction("PUBLIC_DEFAULT", [mediaId])
    const data = await getAreaBackgrounds(businessId, "PUBLIC")
    expect(data.pages.PUBLIC_DEFAULT?.items[0]).toMatchObject({
      focusX: 30,
      focusY: 20,
      desktopFocusX: 80,
      desktopFocusY: 60,
    })
    const service = await prisma.service.findUniqueOrThrow({ where: { id: serviceId } })
    expect(photoPosition(service.photoFocus, service.photoUrls[0])).toBe("70% 20%")
  })

  it("remove a última mídia apenas da página e permite restaurar o padrão", async () => {
    await setPageMediaAction("PUBLIC_HOME", [])
    let data = await getAreaBackgrounds(businessId, "PUBLIC")
    expect(data.pages.PUBLIC_HOME?.items).toHaveLength(0)
    expect(data.pages.PUBLIC_DEFAULT?.items).toHaveLength(1)
    expect(await prisma.backgroundMedia.count({ where: { id: mediaId } })).toBe(1)
    await setPageMediaAction("PUBLIC_HOME", [], true)
    data = await getAreaBackgrounds(businessId, "PUBLIC")
    expect(data.pages.PUBLIC_HOME?.items[0]?.id).toBe(mediaId)
  })

  it("persiste zoom e encaixe por mídia sem copiar arquivos nem alterar outra mídia", async () => {
    const other = await prisma.backgroundMedia.create({
      data: { businessId, name: "Outra", kind: "IMAGE", url: "/uploads/outra.jpg" },
    })
    const frames = {
      mobile: { x: 20, y: 30, zoom: 1, fit: "contain" as const },
      desktop: { x: 80, y: 60, zoom: 1.5, fit: "cover" as const },
    }
    const before = await prisma.backgroundMedia.findUniqueOrThrow({ where: { id: mediaId } })
    expect(await setMediaFocusAction(mediaId, 20, 30, 80, 60, frames)).toHaveProperty("success")
    const data = await getAreaBackgrounds(businessId, "PUBLIC")
    expect(data.pages.PUBLIC_DEFAULT?.items[0]).toMatchObject({ framing: frames, url: before.url })
    expect(await prisma.backgroundMedia.count({ where: { businessId } })).toBe(2)
    expect(
      (await prisma.backgroundMedia.findUniqueOrThrow({ where: { id: other.id } })).framing,
    ).toBeNull()
    expect(
      await setMediaFocusAction(mediaId, 20, 30, 80, 60, {
        ...frames,
        desktop: { ...frames.desktop, zoom: 9 },
      }),
    ).toHaveProperty("error")
    expect(
      (await prisma.backgroundMedia.findUniqueOrThrow({ where: { id: mediaId } })).framing,
    ).toEqual(frames)
  })

  it("persiste o almoço editado e permite removê-lo", async () => {
    const form = new FormData()
    for (let weekday = 0; weekday < 7; weekday++) {
      for (const [field, value] of Object.entries({
        enabled: "on",
        start: "09:00",
        end: "19:00",
        breakStart: "12:15",
        breakEnd: "13:45",
      }))
        form.set(`d${weekday}.${field}`, value)
    }
    expect(await saveWorkingHoursAction({}, form)).toHaveProperty("success")
    let day = await prisma.workingHours.findUniqueOrThrow({
      where: { businessId_weekday: { businessId, weekday: 1 } },
    })
    expect([day.breakStartMin, day.breakEndMin]).toEqual([735, 825])
    form.set("d1.breakStart", "")
    form.set("d1.breakEnd", "")
    await saveWorkingHoursAction({}, form)
    day = await prisma.workingHours.findUniqueOrThrow({
      where: { businessId_weekday: { businessId, weekday: 1 } },
    })
    expect([day.breakStartMin, day.breakEndMin]).toEqual([null, null])
  })

  it("registra avisos e impede reabrir um horário ocupado", async () => {
    const input = {
      businessId,
      clientId,
      serviceId,
      startsAt,
      origin: "ADMIN" as const,
      status: "CONFIRMED" as const,
    }
    const first = await bookAppointment(input)
    await changeAppointmentStatus(businessId, first.id, "CANCELLED")
    const second = await bookAppointment(input)
    await expect(changeAppointmentStatus(businessId, first.id, "CONFIRMED")).rejects.toMatchObject({
      code: "UNAVAILABLE",
    })
    await changeAppointmentStatus(businessId, second.id, "NO_SHOW")
    const third = await bookAppointment(input)
    await bookAppointment({
      ...input,
      rescheduleId: third.id,
      startsAt: new Date(startsAt.getTime() + 90 * 60000),
    })
    const notices = await prisma.appointmentNotice.findMany({
      where: { appointmentId: { in: [first.id, second.id, third.id] } },
    })
    expect(notices.map((n) => n.message).join(" ")).toMatch(/cancelado/)
    expect(notices.map((n) => n.message).join(" ")).toMatch(/falta/)
    expect(notices.map((n) => n.message).join(" ")).toMatch(/remarcado de/)
  })
})
