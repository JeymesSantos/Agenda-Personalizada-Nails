import { subHours } from "date-fns"

import type { ReminderKind } from "@/generated/prisma/enums"

/*
 * Quando cada lembrete deve sair, a partir do início do atendimento. Função
 * pura, usada ao agendar/remarcar e no seed. A confirmação sai na hora;
 * os avisos de 24 h e 2 h só entram se ainda estão no futuro.
 */
export const REMINDER_HOURS_BEFORE: Record<Exclude<ReminderKind, "CONFIRMATION">, number> = {
  BEFORE_24H: 24,
  BEFORE_2H: 2,
}

export type PlannedReminder = { kind: ReminderKind; sendAt: Date }

export function planReminders(startsAt: Date, now: Date): PlannedReminder[] {
  const planned: PlannedReminder[] = [{ kind: "CONFIRMATION", sendAt: now }]
  for (const [kind, hours] of Object.entries(REMINDER_HOURS_BEFORE) as [
    keyof typeof REMINDER_HOURS_BEFORE,
    number,
  ][]) {
    const sendAt = subHours(startsAt, hours)
    if (sendAt.getTime() > now.getTime()) planned.push({ kind, sendAt })
  }
  return planned
}
