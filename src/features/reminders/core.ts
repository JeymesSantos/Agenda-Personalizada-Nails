import "server-only"

import type { Prisma } from "@/generated/prisma/client"
import type { ReminderChannel } from "@/generated/prisma/enums"
import { appBaseUrl, createEmailNotifier, type EmailNotifier } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"

import { planReminders } from "./plan"
import { type ReminderContext, reminderHtml, reminderSubject, reminderText } from "./templates"

/*
 * Lembretes de um agendamento: confirmação na hora, 24 h e 2 h antes, nos
 * canais que a cliente tem (e-mail e/ou WhatsApp). E-mail é enviado pelo cron
 * (dispatchDueReminders); WhatsApp fica SCHEDULED até a profissional mandar
 * pelo link wa.me e marcar como enviado no painel.
 */

const ACTIVE = ["PENDING", "CONFIRMED"] as const

/* (Re)cria os lembretes futuros de um agendamento; chamado ao criar, remarcar ou reabrir. */
export async function scheduleReminders(appointmentId: string, now = new Date()): Promise<number> {
  const a = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { startsAt: true, status: true, client: { select: { email: true, whatsapp: true } } },
  })
  if (!a || !ACTIVE.includes(a.status as (typeof ACTIVE)[number])) return 0

  const channels: ReminderChannel[] = []
  if (a.client.email) channels.push("EMAIL")
  if (a.client.whatsapp) channels.push("WHATSAPP")
  const planned = planReminders(a.startsAt, now)

  const rows: Prisma.ReminderCreateManyInput[] = channels.flatMap((channel) =>
    planned.map((p) => ({ appointmentId, channel, kind: p.kind, sendAt: p.sendAt })),
  )
  await prisma.$transaction([
    /* o que ainda não saiu é substituído; o que já foi enviado fica no histórico */
    prisma.reminder.deleteMany({
      where: { appointmentId, status: { in: ["SCHEDULED", "FAILED"] } },
    }),
    ...(rows.length > 0 ? [prisma.reminder.createMany({ data: rows, skipDuplicates: true })] : []),
  ])
  return rows.length
}

/* Cancela o que ainda não saiu (agendamento cancelado, concluído ou falta). */
export async function cancelReminders(appointmentId: string): Promise<void> {
  await prisma.reminder.updateMany({
    where: { appointmentId, status: "SCHEDULED" },
    data: { status: "CANCELLED" },
  })
}

export type DispatchResult = { sent: number; failed: number; skipped: number }

/*
 * Envia os e-mails vencidos (sendAt <= now). Lembrete de agendamento que não
 * está mais ativo é cancelado em vez de enviado. `notifier` é injetável para
 * os testes.
 */
export async function dispatchDueReminders(
  now = new Date(),
  notifier: EmailNotifier = createEmailNotifier(),
  limit = 50,
): Promise<DispatchResult> {
  const due = await prisma.reminder.findMany({
    where: { status: "SCHEDULED", channel: "EMAIL", sendAt: { lte: now } },
    orderBy: { sendAt: "asc" },
    take: limit,
    include: {
      appointment: {
        include: {
          client: { select: { name: true, email: true } },
          service: { select: { title: true } },
          business: {
            select: {
              name: true,
              timezone: true,
              addressLine: true,
              neighborhood: true,
              whatsapp: true,
            },
          },
        },
      },
    },
  })

  const result: DispatchResult = { sent: 0, failed: 0, skipped: 0 }
  const baseUrl = appBaseUrl()

  for (const r of due) {
    const a = r.appointment
    const active = ACTIVE.includes(a.status as (typeof ACTIVE)[number])
    /* lembrete "antes" de um horário que já passou não faz mais sentido */
    const stale = r.kind !== "CONFIRMATION" && a.startsAt.getTime() <= now.getTime()
    if (!active || stale || !a.client.email) {
      await prisma.reminder.update({ where: { id: r.id }, data: { status: "CANCELLED" } })
      result.skipped++
      continue
    }
    const ctx: ReminderContext = {
      kind: r.kind,
      clientName: a.client.name,
      businessName: a.business.name,
      serviceTitle: a.service.title,
      startsAt: a.startsAt,
      timezone: a.business.timezone,
      code: a.code,
      manageToken: a.manageToken,
      baseUrl,
      addressLine: a.business.addressLine,
      neighborhood: a.business.neighborhood,
      businessWhatsapp: a.business.whatsapp,
    }
    try {
      await notifier.send({
        to: a.client.email,
        subject: reminderSubject(ctx),
        text: reminderText(ctx),
        html: reminderHtml(ctx),
      })
      await prisma.reminder.update({
        where: { id: r.id },
        data: { status: "SENT", sentAt: now, error: null },
      })
      result.sent++
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      await prisma.reminder.update({
        where: { id: r.id },
        data: { status: "FAILED", error: message.slice(0, 500) },
      })
      result.failed++
    }
  }
  return result
}
