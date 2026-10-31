import "server-only"
import { addDays } from "date-fns"

import {
  dayStart,
  isPeriodKind,
  periodFor,
  previousPeriod,
  type Period,
  type PeriodKind,
} from "@/lib/dates"
import {
  deltaPct,
  occupancy,
  seriesBy,
  summarize,
  topServices,
  type FinanceAppointment,
  type FinanceExpense,
  type FinanceSummary,
  type Occupancy,
  type SeriesPoint,
  type ServiceRank,
} from "@/lib/finance"
import { prisma } from "@/lib/prisma"
import type { AppointmentStatus } from "@/generated/prisma/enums"

export type AgendaItem = {
  id: string
  code: string
  startsAt: Date
  serviceEndsAt: Date
  endsAt: Date
  durationMin: number
  status: AppointmentStatus
  clientName: string
  clientRegistered: boolean
  clientWhatsapp: string | null
  serviceTitle: string
  priceCents: number
  note: string | null
}

export type DashboardData = {
  period: Period
  previous: Period
  kind: PeriodKind
  summary: FinanceSummary
  previousSummary: FinanceSummary
  /** Resumo do mês corrente, usado pela visão "Dia" (card "Lucro do mês"). */
  monthSummary: FinanceSummary
  deltas: { revenue: number | null; done: number | null; ticket: number | null }
  series: SeriesPoint[]
  seriesUnit: "day" | "week" | "month"
  occupancy: Occupancy
  topServices: ServiceRank[]
  today: AgendaItem[]
  todayRevenueCents: number
  todayDone: number
  todayPending: number
  todayFreeSlots: number
  nextAppointment: AgendaItem | null
}

export function parsePeriodKind(value: unknown): PeriodKind {
  return isPeriodKind(value) ? value : "mes"
}

export async function getDashboardData(
  businessId: string,
  kind: PeriodKind,
  now: Date,
  timezone: string,
): Promise<DashboardData> {
  const period = periodFor(kind, now, timezone)
  const previous = previousPeriod(period, timezone)
  const todayStart = dayStart(now, timezone)
  const todayEnd = addDays(todayStart, 1)

  const month = periodFor("mes", now, timezone)
  const candidatesStart = [previous.start, todayStart, month.start]
  const candidatesEnd = [period.end, todayEnd, month.end]
  const rangeStart = new Date(Math.min(...candidatesStart.map((d) => d.getTime())))
  const rangeEnd = new Date(Math.max(...candidatesEnd.map((d) => d.getTime())))

  const [appointments, expenses, workingHours, exceptions] = await Promise.all([
    prisma.appointment.findMany({
      where: { businessId, startsAt: { gte: rangeStart, lt: rangeEnd } },
      include: { service: { select: { id: true, title: true, durationMin: true } }, client: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.expense.findMany({ where: { businessId, date: { gte: rangeStart, lt: rangeEnd } } }),
    prisma.workingHours.findMany({ where: { businessId } }),
    prisma.scheduleException.findMany({
      where: { businessId, endsAt: { gt: rangeStart }, startsAt: { lt: rangeEnd } },
    }),
  ])

  const fin: FinanceAppointment[] = appointments.map((a) => ({
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    status: a.status,
    priceCents: a.priceCents,
    serviceId: a.service.id,
    serviceTitle: a.service.title,
  }))
  const exp: FinanceExpense[] = expenses.map((e) => ({
    date: e.date,
    amountCents: e.amountCents,
    type: e.type,
    category: e.category,
  }))

  const summary = summarize(period, fin, exp)
  const previousSummary = summarize(previous, fin, exp)
  const monthSummary = summarize(month, fin, exp)
  const schedule = { timezone, workingHours, exceptions }

  const seriesUnit = kind === "ano" ? "month" : kind === "mes" ? "week" : "day"

  const today: AgendaItem[] = appointments
    .filter((a) => a.startsAt >= todayStart && a.startsAt < todayEnd && a.status !== "CANCELLED")
    .map((a) => ({
      id: a.id,
      code: a.code,
      startsAt: a.startsAt,
      serviceEndsAt: a.serviceEndsAt,
      endsAt: a.endsAt,
      durationMin: a.service.durationMin,
      status: a.status,
      clientName: a.client.name,
      clientRegistered: Boolean(a.client.passwordHash),
      clientWhatsapp: a.client.whatsapp,
      serviceTitle: a.service.title,
      priceCents: a.priceCents,
      note: a.note,
    }))

  const todayOcc = occupancy({ start: todayStart, end: todayEnd }, fin, schedule)
  const nextAppointment =
    today.find((a) => a.startsAt > now && (a.status === "CONFIRMED" || a.status === "PENDING")) ??
    null

  return {
    period,
    previous,
    kind,
    summary,
    previousSummary,
    monthSummary,
    deltas: {
      revenue: deltaPct(summary.revenueCents, previousSummary.revenueCents),
      done: previousSummary.doneCount ? summary.doneCount - previousSummary.doneCount : null,
      ticket: deltaPct(summary.averageTicketCents, previousSummary.averageTicketCents),
    },
    series: seriesBy(period, seriesUnit, fin, exp),
    seriesUnit,
    occupancy: occupancy(period, fin, schedule),
    topServices: topServices(period, fin),
    today,
    todayRevenueCents: today
      .filter((a) => a.status === "DONE")
      .reduce((s, a) => s + a.priceCents, 0),
    todayDone: today.filter((a) => a.status === "DONE").length,
    todayPending: today.filter((a) => a.status === "PENDING").length,
    todayFreeSlots: Math.max(0, Math.floor((todayOcc.availableMin - todayOcc.bookedMin) / 75)),
    nextAppointment,
  }
}
