import "dotenv/config"
import { addDays } from "date-fns"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../src/generated/prisma/client"
import type { EmailMessage, EmailNotifier } from "../../src/lib/notifications"

/*
 * Integração com o Postgres local: um agendamento gera os lembretes nos
 * canais da cliente, o cron envia os de e-mail vencidos e o cancelamento
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
  const sent: EmailMessage[] = []
  const fakeNotifier: EmailNotifier = {
    name: "fake",
    async send(m) {
      sent.push(m)
    },
  }

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
    expect(reminders).toHaveLength(6)
    expect(reminders.filter((r) => r.channel === "EMAIL")).toHaveLength(3)
    expect(reminders.every((r) => r.status === "SCHEDULED")).toBe(true)
  })

  it("o cron envia só os e-mails vencidos e marca como enviados", async () => {
    const { dispatchDueReminders } = await import("../../src/features/reminders/core")
    const result = await dispatchDueReminders(new Date(), fakeNotifier)
    /* a confirmação deste agendamento venceu; os de 24 h / 2 h ainda não */
    const mine = await prisma.reminder.findMany({ where: { appointmentId, channel: "EMAIL" } })
    const confirmation = mine.find((r) => r.kind === "CONFIRMATION")!
    expect(confirmation.status).toBe("SENT")
    expect(mine.filter((r) => r.status === "SCHEDULED")).toHaveLength(2)
    expect(result.sent).toBeGreaterThanOrEqual(1)
    /* o cron também envia as confirmações do seed: procurar pelo e-mail desta cliente */
    const msg = sent.find((m) => m.to === clientEmail)!
    expect(msg).toBeDefined()
    expect(msg.subject).toContain("Horário confirmado")
    expect(msg.text).toContain(
      `/agendamento/${(await prisma.appointment.findUniqueOrThrow({ where: { id: appointmentId } })).code}?t=`,
    )
    /* WhatsApp não é enviado pelo cron */
    const wa = await prisma.reminder.findMany({ where: { appointmentId, channel: "WHATSAPP" } })
    expect(wa.every((r) => r.status === "SCHEDULED")).toBe(true)
  })

  it("cancelar o agendamento cancela os pendentes e preserva os enviados", async () => {
    const { cancelReminders } = await import("../../src/features/reminders/core")
    await prisma.appointment.update({ where: { id: appointmentId }, data: { status: "CANCELLED" } })
    await cancelReminders(appointmentId)
    const reminders = await prisma.reminder.findMany({ where: { appointmentId } })
    expect(reminders.filter((r) => r.status === "SENT")).toHaveLength(1)
    expect(reminders.filter((r) => r.status === "CANCELLED")).toHaveLength(5)
  })
})
