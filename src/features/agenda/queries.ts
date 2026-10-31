import "server-only"
import { addDays, startOfWeek } from "date-fns"
import { TZDate } from "@date-fns/tz"

import type { AppointmentStatus, ExceptionType } from "@/generated/prisma/enums"
import { dayStart, tz } from "@/lib/dates"
import { prisma } from "@/lib/prisma"
import { minutesFromDayStart, localDayStart } from "@/lib/scheduling"

export type AgendaView = "dia" | "semana" | "mes"

export type AgendaBlock = {
  id: string
  kind: "appointment" | "break" | "block" | "release"
  dayKey: string
  startMin: number
  endMin: number
  /** Para agendamentos: fim do atendimento (antes da reorganização). */
  serviceEndMin?: number
  title: string
  subtitle?: string
  status?: AppointmentStatus
  exceptionType?: ExceptionType
}

export type AgendaDay = {
  key: string
  date: Date
  weekdayShort: string
  dayNumber: number
  isToday: boolean
  closed: boolean
}

export type AgendaData = {
  view: AgendaView
  anchor: Date
  rangeStart: Date
  rangeEnd: Date
  days: AgendaDay[]
  blocks: AgendaBlock[]
  gridStartMin: number
  gridEndMin: number
  title: string
}

export function parseView(value: unknown, fallback: AgendaView): AgendaView {
  return value === "dia" || value === "semana" || value === "mes" ? value : fallback
}

export function dayKey(date: Date, timezone: string): string {
  const z = tz(date, timezone)
  return `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, "0")}-${String(z.getDate()).padStart(2, "0")}`
}

const SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export async function getAgendaData(
  businessId: string,
  view: AgendaView,
  anchor: Date,
  now: Date,
  timezone: string,
): Promise<AgendaData> {
  const workingHours = await prisma.workingHours.findMany({ where: { businessId } })
  const enabledDays = new Set(workingHours.filter((w) => w.enabled).map((w) => w.weekday))

  let rangeStart: Date
  let dayCount: number
  if (view === "dia") {
    rangeStart = dayStart(anchor, timezone)
    dayCount = 1
  } else if (view === "semana") {
    const z = tz(anchor, timezone)
    const monday = new TZDate(startOfWeek(z, { weekStartsOn: 1 }), timezone)
    rangeStart = new TZDate(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate(),
      0,
      0,
      0,
      timezone,
    )
    /* mostra domingo só se o estúdio abre no domingo */
    dayCount = enabledDays.has(0) ? 7 : 6
  } else {
    const z = tz(anchor, timezone)
    const first = new TZDate(z.getFullYear(), z.getMonth(), 1, 0, 0, 0, timezone)
    const monday = new TZDate(startOfWeek(first, { weekStartsOn: 1 }), timezone)
    rangeStart = new TZDate(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate(),
      0,
      0,
      0,
      timezone,
    )
    dayCount = 42
  }
  const rangeEnd = addDays(rangeStart, dayCount)

  const [appointments, exceptions] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        businessId,
        status: { not: "CANCELLED" },
        endsAt: { gt: rangeStart },
        startsAt: { lt: rangeEnd },
      },
      include: {
        client: { select: { name: true } },
        service: { select: { title: true, durationMin: true } },
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.scheduleException.findMany({
      where: { businessId, endsAt: { gt: rangeStart }, startsAt: { lt: rangeEnd } },
    }),
  ])

  const todayKey = dayKey(now, timezone)
  const days: AgendaDay[] = Array.from({ length: dayCount }, (_, i) => {
    const date = addDays(rangeStart, i)
    const z = tz(date, timezone)
    return {
      key: dayKey(date, timezone),
      date,
      weekdayShort: SHORT[z.getDay()],
      dayNumber: z.getDate(),
      isToday: dayKey(date, timezone) === todayKey,
      closed: !enabledDays.has(z.getDay()),
    }
  })

  const blocks: AgendaBlock[] = []
  let gridStartMin = 24 * 60
  let gridEndMin = 0
  for (const w of workingHours) {
    if (!w.enabled) continue
    gridStartMin = Math.min(gridStartMin, w.startMin)
    gridEndMin = Math.max(gridEndMin, w.endMin)
  }
  if (gridStartMin >= gridEndMin) {
    gridStartMin = 9 * 60
    gridEndMin = 19 * 60
  }

  for (const day of days) {
    const ds = localDayStart(day.date, timezone)
    const rule = workingHours.find((w) => w.weekday === tz(day.date, timezone).getDay())
    if (rule?.enabled && rule.breakStartMin != null && rule.breakEndMin != null) {
      blocks.push({
        id: `break-${day.key}`,
        kind: "break",
        dayKey: day.key,
        startMin: rule.breakStartMin,
        endMin: rule.breakEndMin,
        title: "Almoço",
        subtitle: "bloqueado",
      })
    }
    for (const e of exceptions) {
      const s = Math.max(0, minutesFromDayStart(e.startsAt, ds))
      const en = Math.min(24 * 60, minutesFromDayStart(e.endsAt, ds))
      if (en <= 0 || s >= 24 * 60 || en <= s) continue
      const startMin = e.allDay ? gridStartMin : Math.max(s, 0)
      const endMin = e.allDay ? gridEndMin : en
      blocks.push({
        id: `${e.id}-${day.key}`,
        kind: e.type === "BLOCK" ? "block" : "release",
        dayKey: day.key,
        startMin,
        endMin,
        title: e.type === "BLOCK" ? "Bloqueado" : "Liberado",
        subtitle: e.reason ?? undefined,
        exceptionType: e.type,
      })
      if (e.type === "RELEASE") {
        gridStartMin = Math.min(gridStartMin, startMin)
        gridEndMin = Math.max(gridEndMin, endMin)
      }
    }
  }

  for (const a of appointments) {
    const key = dayKey(a.startsAt, timezone)
    const ds = localDayStart(a.startsAt, timezone)
    const startMin = minutesFromDayStart(a.startsAt, ds)
    const endMin = minutesFromDayStart(a.endsAt, ds)
    const serviceEndMin = minutesFromDayStart(a.serviceEndsAt, ds)
    gridStartMin = Math.min(gridStartMin, Math.floor(startMin / 60) * 60)
    gridEndMin = Math.max(gridEndMin, Math.ceil(endMin / 60) * 60)
    const [first, ...rest] = a.client.name.split(" ")
    const shortName = rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first
    blocks.push({
      id: a.id,
      kind: "appointment",
      dayKey: key,
      startMin,
      endMin,
      serviceEndMin,
      title: shortName,
      subtitle: `${a.service.title} · ${formatDur(a.service.durationMin)}`,
      status: a.status,
    })
  }

  const z = tz(anchor, timezone)
  const title =
    view === "dia"
      ? cap(
          z.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: timezone,
          }),
        )
      : view === "semana"
        ? `${days[0].dayNumber} – ${days[days.length - 1].dayNumber} de ${monthName(days[days.length - 1].date, timezone)}`
        : cap(z.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: timezone }))

  return { view, anchor, rangeStart, rangeEnd, days, blocks, gridStartMin, gridEndMin, title }
}

function formatDur(min: number) {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`
}

function monthName(date: Date, timezone: string) {
  return date.toLocaleDateString("pt-BR", { month: "long", timeZone: timezone })
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export async function getAppointmentDetail(businessId: string, id: string) {
  const a = await prisma.appointment.findFirst({
    where: { id, businessId },
    include: { client: true, service: true },
  })
  if (!a) return null
  const visits = await prisma.appointment.count({
    where: {
      businessId,
      clientId: a.clientId,
      status: { in: ["DONE", "CONFIRMED", "PENDING"] },
      startsAt: { lte: a.startsAt },
    },
  })
  return { ...a, visits }
}

export async function searchClients(businessId: string, q: string) {
  const term = q.trim()
  if (term.length < 2) return []
  const digits = term.replace(/\D/g, "")
  return prisma.user.findMany({
    where: {
      role: "CLIENT",
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        ...(digits.length >= 3 ? [{ whatsapp: { contains: digits } }] : []),
      ],
    },
    select: { id: true, name: true, whatsapp: true, passwordHash: true },
    take: 8,
    orderBy: { name: "asc" },
  })
}

export async function listVisibleServices(businessId: string) {
  return prisma.service.findMany({
    where: { businessId },
    select: {
      id: true,
      title: true,
      durationMin: true,
      bufferMin: true,
      priceCents: true,
      visible: true,
    },
    orderBy: [{ order: "asc" }],
  })
}
