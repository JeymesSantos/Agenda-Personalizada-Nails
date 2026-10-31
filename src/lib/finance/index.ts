import { addDays, addMonths, format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { getOpenIntervals, totalMinutes, type AvailabilityInput } from "@/lib/scheduling"

/*
 * Cálculos financeiros do painel, puros e testáveis.
 * Receita = agendamentos CONCLUÍDOS no período; despesas = lançamentos do período;
 * lucro = receita − despesas; ocupação = minutos agendados / minutos abertos.
 */

export type FinanceStatus = "PENDING" | "CONFIRMED" | "DONE" | "CANCELLED" | "NO_SHOW"

export type FinanceAppointment = {
  startsAt: Date
  endsAt: Date
  status: FinanceStatus
  priceCents: number
  serviceId: string
  serviceTitle: string
}

export type FinanceExpense = {
  date: Date
  amountCents: number
  type: "FIXED" | "VARIABLE"
  category: string
}

export type Range = { start: Date; end: Date }

export type FinanceSummary = {
  revenueCents: number
  doneCount: number
  averageTicketCents: number
  expensesCents: number
  fixedCents: number
  variableCents: number
  profitCents: number
  /** Lucro / receita, 0–100. */
  marginPct: number
}

const ACTIVE: FinanceStatus[] = ["PENDING", "CONFIRMED", "DONE"]

export function inRange(date: Date, range: Range): boolean {
  return date >= range.start && date < range.end
}

export function summarize(
  range: Range,
  appointments: FinanceAppointment[],
  expenses: FinanceExpense[],
): FinanceSummary {
  const done = appointments.filter((a) => a.status === "DONE" && inRange(a.startsAt, range))
  const revenueCents = done.reduce((s, a) => s + a.priceCents, 0)
  const periodExpenses = expenses.filter((e) => inRange(e.date, range))
  const fixedCents = periodExpenses
    .filter((e) => e.type === "FIXED")
    .reduce((s, e) => s + e.amountCents, 0)
  const variableCents = periodExpenses
    .filter((e) => e.type === "VARIABLE")
    .reduce((s, e) => s + e.amountCents, 0)
  const expensesCents = fixedCents + variableCents
  const profitCents = revenueCents - expensesCents
  return {
    revenueCents,
    doneCount: done.length,
    averageTicketCents: done.length ? Math.round(revenueCents / done.length) : 0,
    expensesCents,
    fixedCents,
    variableCents,
    profitCents,
    marginPct: revenueCents > 0 ? Math.round((profitCents / revenueCents) * 100) : 0,
  }
}

/** Variação percentual de `current` sobre `previous`; null quando não há base. */
export function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export type SeriesPoint = {
  label: string
  revenueCents: number
  expensesCents: number
  start: Date
  end: Date
}
export type WeekPoint = SeriesPoint
export type SeriesUnit = "day" | "week" | "month"

/** Série de receita × despesas por dia, semana (blocos de 7 dias) ou mês. */
export function seriesBy(
  range: Range,
  unit: SeriesUnit,
  appointments: FinanceAppointment[],
  expenses: FinanceExpense[],
): SeriesPoint[] {
  const points: SeriesPoint[] = []
  let start = range.start
  let i = 1
  while (start < range.end) {
    const next =
      unit === "day" ? addDays(start, 1) : unit === "week" ? addDays(start, 7) : addMonths(start, 1)
    const end = next < range.end ? next : range.end
    const s = summarize({ start, end }, appointments, expenses)
    const raw =
      unit === "week"
        ? `Sem ${i}`
        : unit === "day"
          ? format(start, "EEE d", { locale: ptBR }).replace(".", "")
          : format(start, "MMM", { locale: ptBR }).replace(".", "")
    points.push({
      label: raw.charAt(0).toUpperCase() + raw.slice(1),
      revenueCents: s.revenueCents,
      expensesCents: s.expensesCents,
      start,
      end,
    })
    start = end
    i++
  }
  return points
}

/** Série por semana (blocos de 7 dias a partir do início do período). */
export function weeklySeries(
  range: Range,
  appointments: FinanceAppointment[],
  expenses: FinanceExpense[],
): WeekPoint[] {
  return seriesBy(range, "week", appointments, expenses)
}

export type Occupancy = { bookedMin: number; availableMin: number; pct: number }

/**
 * Ocupação do período: minutos de agendamentos ativos (atendimento + reorganização)
 * sobre minutos em que o estúdio esteve aberto.
 */
export function occupancy(
  range: Range,
  appointments: FinanceAppointment[],
  schedule: Pick<AvailabilityInput, "timezone" | "workingHours" | "exceptions">,
): Occupancy {
  let availableMin = 0
  for (let day = range.start; day < range.end; day = addDays(day, 1)) {
    availableMin += totalMinutes(getOpenIntervals(day, schedule))
  }
  const bookedMin = appointments
    .filter((a) => ACTIVE.includes(a.status) && inRange(a.startsAt, range))
    .reduce((s, a) => s + (a.endsAt.getTime() - a.startsAt.getTime()) / 60_000, 0)
  return {
    bookedMin,
    availableMin,
    pct: availableMin > 0 ? Math.min(100, Math.round((bookedMin / availableMin) * 100)) : 0,
  }
}

export type ServiceRank = { serviceId: string; title: string; count: number; revenueCents: number }

export function topServices(
  range: Range,
  appointments: FinanceAppointment[],
  limit = 4,
): ServiceRank[] {
  const map = new Map<string, ServiceRank>()
  for (const a of appointments) {
    if (a.status !== "DONE" || !inRange(a.startsAt, range)) continue
    const entry = map.get(a.serviceId) ?? {
      serviceId: a.serviceId,
      title: a.serviceTitle,
      count: 0,
      revenueCents: 0,
    }
    entry.count++
    entry.revenueCents += a.priceCents
    map.set(a.serviceId, entry)
  }
  return [...map.values()]
    .sort((a, b) => b.count - a.count || b.revenueCents - a.revenueCents)
    .slice(0, limit)
}

export type CategoryTotal = { category: string; amountCents: number; pct: number }

export function expensesByCategory(range: Range, expenses: FinanceExpense[]): CategoryTotal[] {
  const map = new Map<string, number>()
  let total = 0
  for (const e of expenses) {
    if (!inRange(e.date, range)) continue
    map.set(e.category, (map.get(e.category) ?? 0) + e.amountCents)
    total += e.amountCents
  }
  return [...map.entries()]
    .map(([category, amountCents]) => ({
      category,
      amountCents,
      pct: total ? Math.round((amountCents / total) * 100) : 0,
    }))
    .sort((a, b) => b.amountCents - a.amountCents)
}
