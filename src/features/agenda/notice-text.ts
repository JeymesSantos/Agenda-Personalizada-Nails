import { fmtShortDate, fmtTime } from "@/lib/dates"

export function appointmentNotice(
  kind: "CANCELLED" | "NO_SHOW" | "RESCHEDULED",
  service: string,
  startsAt: Date,
  timezone: string,
  previous?: Date,
): string {
  const when = (date: Date) => `${fmtShortDate(date, timezone)} às ${fmtTime(date, timezone)}`
  if (kind === "CANCELLED")
    return `O agendamento de ${service}, em ${when(startsAt)}, foi cancelado.`
  if (kind === "NO_SHOW")
    return `Foi registrada uma falta no atendimento de ${service}, em ${when(startsAt)}.`
  return previous
    ? `O agendamento de ${service} foi remarcado de ${when(previous)} para ${when(startsAt)}.`
    : `O agendamento de ${service} foi remarcado para ${when(startsAt)}.`
}
