import "dotenv/config"
import { TZDate } from "@date-fns/tz"
import { addDays } from "date-fns"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../src/generated/prisma/client"

/*
 * Integração com o Postgres local (docker compose up -d && pnpm db:seed).
 * Dois pedidos simultâneos para o mesmo horário: exatamente um vence.
 */
const hasDb = Boolean(process.env.DATABASE_URL)

describe.skipIf(!hasDb)("bookAppointment (concorrência)", () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  })
  let businessId: string
  let serviceId: string
  let clientA: string
  let clientB: string
  let startsAt: Date
  const createdIds: string[] = []

  beforeAll(async () => {
    const business = await prisma.business.findFirstOrThrow()
    businessId = business.id
    const service = await prisma.service.findFirstOrThrow({ where: { businessId, visible: true } })
    serviceId = service.id
    const a = await prisma.user.create({
      data: { name: "Teste A", whatsapp: `55${Date.now()}`.slice(0, 13), role: "CLIENT" },
    })
    const b = await prisma.user.create({
      data: { name: "Teste B", whatsapp: `56${Date.now()}`.slice(0, 13), role: "CLIENT" },
    })
    clientA = a.id
    clientB = b.id
    /* próxima terça-feira às 09:00 (dia aberto, sem almoço nesse horário); limpa o dia para o teste */
    let d = addDays(new Date(), 1)
    while (new TZDate(d, business.timezone).getDay() !== 2) d = addDays(d, 1)
    const z = new TZDate(d, business.timezone)
    startsAt = new TZDate(z.getFullYear(), z.getMonth(), z.getDate(), 9, 0, 0, business.timezone)
    const dayEnd = addDays(
      new TZDate(z.getFullYear(), z.getMonth(), z.getDate(), 0, 0, 0, business.timezone),
      1,
    )
    await prisma.appointment.updateMany({
      where: {
        businessId,
        startsAt: { lt: dayEnd },
        endsAt: { gt: startsAt },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      data: { status: "CANCELLED" },
    })
  })

  afterAll(async () => {
    await prisma.appointment.deleteMany({ where: { id: { in: createdIds } } })
    await prisma.user.deleteMany({ where: { id: { in: [clientA, clientB] } } })
    await prisma.$disconnect()
  })

  it("dois pedidos simultâneos para o mesmo horário: um sucesso, um BookingError", async () => {
    const { bookAppointment, BookingError } = await import("../../src/features/booking/core")
    const attempt = (clientId: string) =>
      bookAppointment({
        businessId,
        clientId,
        serviceId,
        startsAt,
        origin: "CLIENT",
        status: "CONFIRMED",
      })

    const results = await Promise.allSettled([attempt(clientA), attempt(clientB)])
    const ok = results.filter((r) => r.status === "fulfilled")
    const failed = results.filter((r) => r.status === "rejected")
    for (const r of ok) if (r.status === "fulfilled") createdIds.push(r.value.id)

    expect(ok).toHaveLength(1)
    expect(failed).toHaveLength(1)
    const reason = failed[0].status === "rejected" ? failed[0].reason : null
    expect(reason).toBeInstanceOf(BookingError)
    expect((reason as InstanceType<typeof BookingError>).code).toBe("UNAVAILABLE")
  })

  it("um segundo pedido depois do primeiro também é recusado", async () => {
    const { bookAppointment, BookingError } = await import("../../src/features/booking/core")
    await expect(
      bookAppointment({
        businessId,
        clientId: clientB,
        serviceId,
        startsAt,
        origin: "CLIENT",
        status: "CONFIRMED",
      }),
    ).rejects.toBeInstanceOf(BookingError)
  })
})
