import "dotenv/config"
import { addDays } from "date-fns"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../src/generated/prisma/client"

/*
 * Integração com o Postgres local: um agendamento gera lembretes de
 * WhatsApp da cliente, o cron cancela e-mails antigos e o cancelamento
 * cancela os pendentes.
 */
const hasDb = Boolean(process.env.DATABASE_URL)

describe.skipIf(!hasDb)("lembretes", () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  })
  let businessId: string
  let serviceId: string
  let clientId: string
  let clientEmail = ""
  let appointmentId: string

  beforeAll(async () => {
    const business = await prisma.business.findFirstOrThrow()
    businessId = business.id
    const service = await prisma.service.findFirstOrThrow({ where: { businessId, visible: true } })
    serviceId = service.id
    const stamp = Date.now()
    clientEmail = `lembrete-${stamp}@example.com`
    const client = await prisma.user.create({
      data: {
        name: "Teste Lembrete",
        email: clientEmail,
        whatsapp: `57${stamp}`.slice(0, 13),
        role: "CLIENT",
      },
    })
    clientId = client.id
  })

  afterAll(async () => {
    if (appointmentId) await prisma.appointment.delete({ where: { id: appointmentId } })
    await prisma.user.delete({ where: { id: clientId } })
    await prisma.$disconnect()
  })

  it("agendar cria confirmação + 24 h + 2 h por canal", async () => {
    const { bookAppointment } = await import("../../src/features/booking/core")
    /* 20 dias à frente (fora dos agendamentos do seed), dia útil, 9:00 em São Paulo */
    const startsAt = addDays(new Date(), 20)
    if (startsAt.getUTCDay() === 0) startsAt.setUTCDate(startsAt.getUTCDate() + 1)
    startsAt.setUTCHours(12, 0, 0, 0)
    const a = await bookAppointment({
      businessId,
      clientId,
      serviceId,
      startsAt,
      origin: "ADMIN",
      status: "CONFIRMED",
    })
    appointmentId = a.id
    const reminders = await prisma.reminder.findMany({ where: { appointmentId } })
    expect(reminders).toHaveLength(3)
    expect(reminders.filter((r) => r.channel === "EMAIL")).toHaveLength(0)
    expect(reminders.every((r) => r.status === "SCHEDULED")).toBe(true)
  })

  it("o cron cancela e-mails antigos sem enviar e preserva WhatsApp manual", async () => {
    const { dispatchDueReminders } = await import("../../src/features/reminders/core")
    await prisma.reminder.createMany({
      data: [
        {
          appointmentId,
          channel: "EMAIL",
          kind: "CONFIRMATION",
          sendAt: new Date(),
          status: "SCHEDULED",
        },
        {
          appointmentId,
          channel: "EMAIL",
          kind: "BEFORE_24H",
          sendAt: addDays(new Date(), 10),
          status: "FAILED",
        },
      ],
    })
    const result = await dispatchDueReminders()
    expect(result.sent).toBe(0)
    expect(result.failed).toBe(0)
    expect(result.skipped).toBeGreaterThanOrEqual(2)
    const email = await prisma.reminder.findMany({ where: { appointmentId, channel: "EMAIL" } })
    expect(email.every((r) => r.status === "CANCELLED")).toBe(true)
    const wa = await prisma.reminder.findMany({ where: { appointmentId, channel: "WHATSAPP" } })
    expect(wa).toHaveLength(3)
    expect(wa.every((r) => r.status === "SCHEDULED")).toBe(true)
    // O histórico de envios manuais continua preservado ao cancelar.
    await prisma.reminder.update({
      where: { id: wa[0].id },
      data: { status: "SENT", sentAt: new Date() },
    })
  })

  it("cancelar o agendamento cancela os pendentes e preserva os enviados", async () => {
    const { cancelReminders } = await import("../../src/features/reminders/core")
    await prisma.appointment.update({ where: { id: appointmentId }, data: { status: "CANCELLED" } })
    await cancelReminders(appointmentId)
    const reminders = await prisma.reminder.findMany({ where: { appointmentId } })
    expect(reminders.filter((r) => r.status === "SENT")).toHaveLength(1)
    expect(reminders.filter((r) => r.status === "CANCELLED")).toHaveLength(4)
  })
})
