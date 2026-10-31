import { TZDate } from "@date-fns/tz"
import { describe, expect, it } from "vitest"

import { periodFor, previousPeriod } from "@/lib/dates"
import { formatCents, formatPrice, parseCents } from "@/lib/money"
import type { WorkingHoursRule } from "@/lib/scheduling"
import {
  deltaPct,
  expensesByCategory,
  occupancy,
  summarize,
  topServices,
  weeklySeries,
  type FinanceAppointment,
  type FinanceExpense,
} from "./index"

const TZ = "America/Sao_Paulo"
const at = (d: number, h: number, m = 0, month = 9) => new TZDate(2026, month, d, h, m, 0, TZ)

const appt = (
  d: number,
  h: number,
  durationMin: number,
  priceCents: number,
  status: FinanceAppointment["status"] = "DONE",
  serviceTitle = "Manutenção",
): FinanceAppointment => ({
  startsAt: at(d, h),
  endsAt: new Date(at(d, h).getTime() + durationMin * 60_000),
  status,
  priceCents,
  serviceId: serviceTitle,
  serviceTitle,
})

const october = periodFor("mes", at(27, 12), TZ)

const appointments: FinanceAppointment[] = [
  appt(5, 9, 135, 18000, "DONE", "Alongamento em gel"),
  appt(5, 14, 75, 11000),
  appt(12, 9, 75, 11000),
  appt(12, 14, 75, 11000, "CANCELLED"),
  appt(19, 10, 85, 9500, "DONE", "Blindagem"),
  appt(27, 14, 135, 18000, "CONFIRMED", "Alongamento em gel"),
  appt(27, 16, 75, 11000, "PENDING"),
  appt(3, 9, 75, 11000, "DONE", "Manutenção"),
]
appointments[7].startsAt = at(3, 9, 0, 8) // setembro
appointments[7].endsAt = at(3, 10, 15, 8)

const expenses: FinanceExpense[] = [
  { date: at(5, 0), amountCents: 90000, type: "FIXED", category: "Aluguel" },
  { date: at(10, 0), amountCents: 18000, type: "FIXED", category: "Contas" },
  { date: at(8, 0), amountCents: 34000, type: "VARIABLE", category: "Materiais" },
  { date: at(3, 0, 0, 8), amountCents: 90000, type: "FIXED", category: "Aluguel" }, // setembro
]

describe("períodos", () => {
  it("mês corrente e anterior", () => {
    expect(new Date(october.start).toISOString()).toBe("2026-10-01T03:00:00.000Z")
    expect(new Date(october.end).toISOString()).toBe("2026-11-01T03:00:00.000Z")
    expect(october.label).toBe("Outubro 2026")
    const sep = previousPeriod(october, TZ)
    expect(sep.label).toBe("Setembro 2026")
  })

  it("semana começa na segunda", () => {
    const week = periodFor("semana", at(29, 12), TZ) // quinta 29/10
    expect(new Date(week.start).toISOString()).toBe("2026-10-26T03:00:00.000Z")
    expect(new Date(week.end).toISOString()).toBe("2026-11-02T03:00:00.000Z")
  })
})

describe("resumo financeiro", () => {
  it("receita só de concluídos no período, despesas e lucro", () => {
    const s = summarize(october, appointments, expenses)
    expect(s.revenueCents).toBe(18000 + 11000 + 11000 + 9500)
    expect(s.doneCount).toBe(4)
    expect(s.averageTicketCents).toBe(Math.round(49500 / 4))
    expect(s.fixedCents).toBe(108000)
    expect(s.variableCents).toBe(34000)
    expect(s.expensesCents).toBe(142000)
    expect(s.profitCents).toBe(49500 - 142000)
    expect(s.marginPct).toBe(Math.round(((49500 - 142000) / 49500) * 100))
  })

  it("variação percentual", () => {
    expect(deltaPct(842000, 751800)).toBe(12)
    expect(deltaPct(100, 0)).toBeNull()
    expect(deltaPct(80, 100)).toBe(-20)
  })

  it("série semanal cobre o mês inteiro em blocos de 7 dias", () => {
    const series = weeklySeries(october, appointments, expenses)
    expect(series.map((p) => p.label)).toEqual(["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5"])
    expect(series[0].revenueCents).toBe(29000) // dia 5
    expect(series[0].expensesCents).toBe(90000) // aluguel dia 5
    expect(series[1].expensesCents).toBe(18000 + 34000) // contas dia 10, materiais dia 8
    expect(series[1].revenueCents).toBe(11000) // dia 12
    expect(series.at(-1)!.end).toEqual(october.end)
  })

  it("serviços mais vendidos ordenados por quantidade", () => {
    const top = topServices(october, appointments)
    expect(top.map((t) => t.title)).toEqual(["Manutenção", "Alongamento em gel", "Blindagem"])
    expect(top[0].count).toBe(2)
  })

  it("despesas por categoria com percentual", () => {
    const cats = expensesByCategory(october, expenses)
    expect(cats[0]).toEqual({ category: "Aluguel", amountCents: 90000, pct: 63 })
    expect(cats.reduce((s, c) => s + c.pct, 0)).toBeGreaterThanOrEqual(99)
  })
})

describe("ocupação", () => {
  const workingHours: WorkingHoursRule[] = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    enabled: weekday !== 0,
    startMin: 9 * 60,
    endMin: 19 * 60,
    breakStartMin: 12 * 60 + 30,
    breakEndMin: 13 * 60 + 45,
  }))

  it("um dia: 135 + 75 min agendados em 525 min abertos", () => {
    const day = periodFor("dia", at(5, 12), TZ)
    const o = occupancy(day, appointments, { timezone: TZ, workingHours, exceptions: [] })
    expect(o.availableMin).toBe(525)
    expect(o.bookedMin).toBe(210)
    expect(o.pct).toBe(40)
  })

  it("ignora cancelados e conta confirmados e pendentes", () => {
    const day = periodFor("dia", at(27, 12), TZ)
    const o = occupancy(day, appointments, { timezone: TZ, workingHours, exceptions: [] })
    expect(o.bookedMin).toBe(210)
  })
})

describe("dinheiro", () => {
  it("formata como no Figma", () => {
    expect(formatCents(842000)).toBe("R$ 8.420")
    expect(formatCents(13100)).toBe("R$ 131")
    expect(formatPrice(1500, true)).toBe("R$ 15+")
  })

  it("interpreta entradas em pt-BR e en", () => {
    expect(parseCents("R$ 180,00")).toBe(18000)
    expect(parseCents("1.234,56")).toBe(123456)
    expect(parseCents("95")).toBe(9500)
    expect(parseCents("abc")).toBeNull()
  })
})
