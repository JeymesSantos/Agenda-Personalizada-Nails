import "server-only"

import type { Prisma } from "@/generated/prisma/client"
import type { ReminderChannel } from "@/generated/prisma/enums"

import { prisma } from "@/lib/prisma"

import { planReminders } from "./plan"

/* Lembretes da cliente são enviados manualmente pela profissional pelo WhatsApp. */

const ACTIVE = ["PENDING", "CONFIRMED"] as const

/* (Re)cria os lembretes futuros de um agendamento; chamado ao criar, remarcar ou reabrir. */
export async function scheduleReminders(appointmentId: string, now = new Date()): Promise<number> {
  const a = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { startsAt: true, status: true, client: { select: { whatsapp: true } } },
  })
  if (!a || !ACTIVE.includes(a.status as (typeof ACTIVE)[number])) return 0

  const channels: ReminderChannel[] = []
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

/* Cancela lembretes de e-mail antigos sem enviar mensagens à cliente. */
export async function dispatchDueReminders(): Promise<DispatchResult> {
  const cancelled = await prisma.reminder.updateMany({
    where: { channel: "EMAIL", status: { in: ["SCHEDULED", "FAILED"] } },
    data: { status: "CANCELLED" },
  })
  return { sent: 0, failed: 0, skipped: cancelled.count }
}
