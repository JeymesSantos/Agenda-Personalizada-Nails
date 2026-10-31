import { TZDate } from "@date-fns/tz"

import { clip, contains, normalize, subtract, totalMinutes, union } from "./intervals"
import type {
  AvailabilityInput,
  BusyAppointment,
  DayAvailability,
  MinuteInterval,
  ScheduleExceptionRule,
  Slot,
  WorkingHoursRule,
} from "./types"

const MINUTES_IN_DAY = 24 * 60

/* ---------- datas locais ---------- */

/** Meia-noite local do dia em que `date` cai, no fuso informado. */
export function localDayStart(date: Date, timezone: string): TZDate {
  const z = new TZDate(date, timezone)
  return new TZDate(z.getFullYear(), z.getMonth(), z.getDate(), 0, 0, 0, timezone)
}

/** Instante → minutos (pode ser negativo ou > 1440) relativos à meia-noite local de `dayStart`. */
export function minutesFromDayStart(instant: Date, dayStart: Date): number {
  return (instant.getTime() - dayStart.getTime()) / 60_000
}

export function addMinutesTo(dayStart: Date, minutes: number): Date {
  return new Date(dayStart.getTime() + minutes * 60_000)
}

function weekdayOf(dayStart: TZDate): number {
  return dayStart.getDay()
}

/* ---------- intervalos abertos do dia ---------- */

function workingIntervals(rule: WorkingHoursRule | undefined): MinuteInterval[] {
  if (!rule || !rule.enabled) return []
  const base: MinuteInterval = { start: rule.startMin, end: rule.endMin }
  if (
    rule.breakStartMin != null &&
    rule.breakEndMin != null &&
    rule.breakEndMin > rule.breakStartMin
  ) {
    return subtract([base], [{ start: rule.breakStartMin, end: rule.breakEndMin }])
  }
  return normalize([base])
}

function exceptionIntervals(
  exceptions: ScheduleExceptionRule[],
  type: "BLOCK" | "RELEASE",
  dayStart: Date,
): MinuteInterval[] {
  const out: MinuteInterval[] = []
  for (const e of exceptions) {
    if (e.type !== type) continue
    const clipped = clip(
      {
        start: minutesFromDayStart(e.startsAt, dayStart),
        end: minutesFromDayStart(e.endsAt, dayStart),
      },
      0,
      MINUTES_IN_DAY,
    )
    if (clipped) out.push(clipped)
  }
  return out
}

function busyIntervals(appointments: BusyAppointment[], dayStart: Date): MinuteInterval[] {
  const out: MinuteInterval[] = []
  for (const a of appointments) {
    const clipped = clip(
      {
        start: minutesFromDayStart(a.startsAt, dayStart),
        end: minutesFromDayStart(a.endsAt, dayStart),
      },
      0,
      MINUTES_IN_DAY,
    )
    if (clipped) out.push(clipped)
  }
  return out
}

/**
 * Intervalos em que o estúdio está aberto no dia (funcionamento + liberações − bloqueios),
 * ainda sem descontar agendamentos. Útil para a grade da agenda.
 */
export function getOpenIntervals(
  day: Date,
  input: Pick<AvailabilityInput, "timezone" | "workingHours" | "exceptions">,
): MinuteInterval[] {
  const dayStart = localDayStart(day, input.timezone)
  const rule = input.workingHours.find((w) => w.weekday === weekdayOf(dayStart))
  const open = union(
    workingIntervals(rule),
    exceptionIntervals(input.exceptions, "RELEASE", dayStart),
  )
  return subtract(open, exceptionIntervals(input.exceptions, "BLOCK", dayStart))
}

/** Intervalos livres do dia (abertos − agendamentos ativos). */
export function getFreeIntervals(
  day: Date,
  input: Pick<AvailabilityInput, "timezone" | "workingHours" | "exceptions" | "appointments">,
): MinuteInterval[] {
  const dayStart = localDayStart(day, input.timezone)
  return subtract(getOpenIntervals(day, input), busyIntervals(input.appointments, dayStart))
}

/* ---------- slots ---------- */

/**
 * Inícios possíveis para o serviço no dia. Um início t é válido quando
 * [t, t + duração + reorganização) cabe inteiro num intervalo livre e t não está no passado.
 */
export function getAvailableSlots(day: Date, input: AvailabilityInput): Slot[] {
  const step = input.stepMin ?? 15
  const total = input.service.durationMin + input.service.bufferMin
  if (total <= 0) return []

  const dayStart = localDayStart(day, input.timezone)
  const free = getFreeIntervals(day, input)
  if (free.length === 0) return []

  const earliest = minutesFromDayStart(input.now, dayStart) + (input.minNoticeMin ?? 0)
  const slots: Slot[] = []

  for (const interval of free) {
    /* candidatos alinhados ao passo a partir da meia-noite, dentro do intervalo livre */
    const first = Math.ceil(interval.start / step) * step
    for (let t = first; t + total <= interval.end; t += step) {
      if (t < earliest) continue
      if (!contains(free, t, t + total)) continue
      slots.push({
        startMin: t,
        startsAt: addMinutesTo(dayStart, t),
        serviceEndsAt: addMinutesTo(dayStart, t + input.service.durationMin),
        endsAt: addMinutesTo(dayStart, t + total),
      })
    }
  }
  return slots
}

/** Estado do dia para o calendário: fechado, lotado ou com horários. */
export function getDayAvailability(day: Date, input: AvailabilityInput): DayAvailability {
  const open = getOpenIntervals(day, input)
  if (totalMinutes(open) === 0) return "closed"
  return getAvailableSlots(day, input).length > 0 ? "available" : "full"
}

/**
 * Disponibilidade de cada dia de um mês (1..n). `appointments` deve conter os
 * agendamentos ativos do mês inteiro; o filtro por dia é feito aqui.
 */
export function getMonthAvailability(
  year: number,
  monthIndex: number,
  input: AvailabilityInput,
): Record<string, DayAvailability> {
  const result: Record<string, DayAvailability> = {}
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStart = new TZDate(year, monthIndex, d, 0, 0, 0, input.timezone)
    const dayEnd = addMinutesTo(dayStart, MINUTES_IN_DAY)
    const key = formatDayKey(year, monthIndex, d)
    const dayInput: AvailabilityInput = {
      ...input,
      appointments: input.appointments.filter((a) => a.endsAt > dayStart && a.startsAt < dayEnd),
      exceptions: input.exceptions.filter((e) => e.endsAt > dayStart && e.startsAt < dayEnd),
    }
    result[key] = getDayAvailability(dayStart, dayInput)
  }
  return result
}

export function formatDayKey(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/* ---------- conflito ---------- */

/** Verdadeiro se [startsAt, endsAt) cruza algum agendamento ativo. */
export function hasConflict(
  startsAt: Date,
  endsAt: Date,
  appointments: BusyAppointment[],
  ignoreIndex?: number,
): boolean {
  return appointments.some(
    (a, i) => i !== ignoreIndex && a.startsAt < endsAt && a.endsAt > startsAt,
  )
}

/**
 * Verdadeiro se o bloco [startsAt, endsAt) cabe nos intervalos abertos do dia
 * e não cruza agendamentos. É a checagem final feita na transação de criação.
 */
export function isBookable(
  startsAt: Date,
  endsAt: Date,
  input: Pick<AvailabilityInput, "timezone" | "workingHours" | "exceptions" | "appointments">,
): boolean {
  const dayStart = localDayStart(startsAt, input.timezone)
  const start = minutesFromDayStart(startsAt, dayStart)
  const end = minutesFromDayStart(endsAt, dayStart)
  if (end > MINUTES_IN_DAY) return false
  if (!contains(getOpenIntervals(startsAt, input), start, end)) return false
  return !hasConflict(startsAt, endsAt, input.appointments)
}

/* ---------- agrupamento para a interface ---------- */

export function groupSlotsByPeriod(slots: Slot[]): { manha: Slot[]; tarde: Slot[]; noite: Slot[] } {
  return {
    manha: slots.filter((s) => s.startMin < 12 * 60),
    tarde: slots.filter((s) => s.startMin >= 12 * 60 && s.startMin < 18 * 60),
    noite: slots.filter((s) => s.startMin >= 18 * 60),
  }
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}
