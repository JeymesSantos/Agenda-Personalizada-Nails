import "dotenv/config"
import bcrypt from "bcryptjs"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("next-auth", () => ({ AuthError: class extends Error {} }))
vi.mock("@/lib/auth", () => ({ signIn: vi.fn(), signOut: vi.fn() }))
vi.mock("@/lib/session", () => ({ getCurrentUser: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { registerAction } from "../../src/features/auth/actions"
import {
  cancelMyAppointmentAction,
  rescheduleMyAppointmentAction,
} from "../../src/features/client-area/actions"
import {
  getMyAppointment,
  getMyAppointments,
  resolveClientAccess,
} from "../../src/features/client-area/queries"
import { signIn } from "../../src/lib/auth"
import { prisma } from "../../src/lib/prisma"
import { getCurrentUser } from "../../src/lib/session"

describe.skipIf(!process.env.DATABASE_URL)("identidade e acesso aos agendamentos", () => {
  const stamp = `${Date.now()}-${process.pid}`
  const guestEmail = `guest-${stamp}@example.test`
  const email = (suffix: string) => `account-${suffix}-${stamp}@example.test`
  const phone = (suffix: number) =>
    `118${String(Date.now()).slice(-6)}${suffix.toString().padStart(2, "0")}`
  const originalPhone = phone(0)
  const freePhone = phone(1)
  let guestId: string
  let serviceId: string
  let first: { id: string; manageToken: string }
  let second: { id: string; manageToken: string }

  function registration(overrides: Record<string, string> = {}) {
    const form = new FormData()
    for (const [key, value] of Object.entries({
      name: "Nova cliente",
      whatsapp: freePhone,
      email: email("new"),
      password: "senha-teste-123",
      confirm: "senha-teste-123",
      ...overrides,
    }))
      form.set(key, value)
    return form
  }

  beforeAll(async () => {
    const business = await prisma.business.findFirstOrThrow()
    const service = await prisma.service.findFirstOrThrow({
      where: { businessId: business.id, visible: true },
    })
    serviceId = service.id
    const guest = await prisma.user.create({
      data: {
        name: "Cliente original",
        email: guestEmail,
        whatsapp: originalPhone,
        role: "CLIENT",
      },
    })
    guestId = guest.id
    const create = (days: number) => {
      const startsAt = new Date(Date.now() + days * 86400000)
      return prisma.appointment.create({
        data: {
          businessId: business.id,
          clientId: guestId,
          serviceId,
          code: `SEC-${stamp}-${days}`,
          startsAt,
          serviceEndsAt: new Date(startsAt.getTime() + service.durationMin * 60000),
          endsAt: new Date(startsAt.getTime() + (service.durationMin + service.bufferMin) * 60000),
          priceCents: service.priceCents,
          status: "CONFIRMED",
          origin: "CLIENT",
        },
      })
    }
    first = await create(80)
    second = await create(82)
  })

  beforeEach(() => {
    vi.mocked(signIn).mockReset()
    vi.mocked(getCurrentUser).mockReset().mockResolvedValue(null)
  })

  afterAll(async () => {
    if (guestId) await prisma.appointment.deleteMany({ where: { clientId: guestId } })
    await prisma.user.deleteMany({
      where: { OR: [{ id: guestId }, { email: { endsWith: `${stamp}@example.test` } }] },
    })
    await prisma.$disconnect()
  })

  it("não assume uma cliente sem senha ao informar o WhatsApp dela", async () => {
    const result = await registerAction(
      {},
      registration({ whatsapp: originalPhone, email: email("attack") }),
    )
    expect(result.fieldErrors?.whatsapp).toBeDefined()
    expect(await prisma.user.findUnique({ where: { id: guestId } })).toMatchObject({
      name: "Cliente original",
      email: guestEmail,
      whatsapp: originalPhone,
      passwordHash: null,
    })
    expect(await prisma.user.findUnique({ where: { email: email("attack") } })).toBeNull()
    expect(signIn).not.toHaveBeenCalled()
  })

  it("não incorpora um registro sem senha pelo e-mail", async () => {
    const result = await registerAction({}, registration({ email: guestEmail }))
    expect(result.fieldErrors?.email).toBeDefined()
    expect(signIn).not.toHaveBeenCalled()
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: guestId } })).passwordHash,
    ).toBeNull()
  })

  it("continua criando contas novas e trata cadastros simultâneos sem sobrescrever dados", async () => {
    const results = await Promise.all([
      registerAction({}, registration({ email: email("race-a") })),
      registerAction({}, registration({ email: email("race-b") })),
    ])
    expect(results.filter((r) => !r.error && !r.fieldErrors)).toHaveLength(1)
    expect(results.filter((r) => r.error || r.fieldErrors)).toHaveLength(1)
    expect(signIn).toHaveBeenCalledTimes(1)
    const account = await prisma.user.findUniqueOrThrow({ where: { whatsapp: freePhone } })
    expect(account.role).toBe("CLIENT")
    expect(account.id).not.toBe(guestId)
    expect(await bcrypt.compare("senha-teste-123", account.passwordHash!)).toBe(true)
  })

  it("um token lista somente seu agendamento, mesmo com outro no mesmo WhatsApp", async () => {
    const access = await resolveClientAccess(first.manageToken)
    expect(access).toMatchObject({ kind: "token", appointmentId: first.id })
    const listed = await getMyAppointments(access!, new Date())
    expect([...listed.upcoming, ...listed.past].map((a) => a.id)).toEqual([first.id])
    expect(await getMyAppointment(second.id, access)).toBeNull()
    expect(await getMyAppointment(first.id, access)).toMatchObject({ id: first.id })
  })

  it("um token não cancela nem remarca outro agendamento da mesma cliente", async () => {
    expect(await cancelMyAppointmentAction(second.id, first.manageToken)).toEqual({
      error: "Agendamento não encontrado.",
    })
    expect(
      await rescheduleMyAppointmentAction(
        second.id,
        first.manageToken,
        serviceId,
        new Date(Date.now() + 84 * 86400000).toISOString(),
      ),
    ).toEqual({ error: "Agendamento não encontrado." })
    expect((await prisma.appointment.findUniqueOrThrow({ where: { id: second.id } })).status).toBe(
      "CONFIRMED",
    )
  })

  it("uma sessão autenticada continua vendo o próprio histórico completo", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: guestId,
      name: "Cliente original",
      email: guestEmail,
      role: "CLIENT",
    })
    const access = await resolveClientAccess(null)
    expect(access).toEqual({ kind: "member", clientId: guestId })
    const listed = await getMyAppointments(access!, new Date())
    expect(listed.upcoming.map((a) => a.id).sort()).toEqual([first.id, second.id].sort())
    expect(await getMyAppointment(second.id, access)).toMatchObject({ id: second.id })
  })

  it("não troca token inválido por acesso mais amplo da sessão", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: guestId,
      name: "Cliente original",
      email: guestEmail,
      role: "CLIENT",
    })
    expect(await resolveClientAccess("invalido")).toBeNull()
    expect(await getMyAppointment(first.id, null)).toBeNull()
  })
})
