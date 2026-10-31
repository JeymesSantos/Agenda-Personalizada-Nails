import "server-only"
import { TZDate } from "@date-fns/tz"
import { addMonths } from "date-fns"

import {
  expensesByCategory,
  summarize,
  type FinanceAppointment,
  type FinanceExpense,
} from "@/lib/finance"
import { prisma } from "@/lib/prisma"

export function monthRange(ym: string | undefined, now: Date, timezone: string) {
  const m = ym && /^\d{4}-\d{2}$/.test(ym) ? ym : null
  const z = new TZDate(now, timezone)
  const [y, mo] = m ? m.split("-").map(Number) : [z.getFullYear(), z.getMonth() + 1]
  const start = new TZDate(y, mo - 1, 1, 0, 0, 0, timezone)
  const end = addMonths(start, 1)
  const key = `${y}-${String(mo).padStart(2, "0")}`
  return { start, end, key, year: y, month: mo }
}

/**
 * Despesas recorrentes (mensais) geram um lançamento no mês aberto, uma vez só:
 * para cada despesa MONTHLY criada antes do mês, cria a cópia do mês se ainda não existir.
 */
export async function ensureRecurringForMonth(
  businessId: string,
  start: Date,
  end: Date,
  timezone: string,
) {
  const roots = await prisma.expense.findMany({
    where: { businessId, recurrence: "MONTHLY", parentId: null, date: { lt: start } },
  })
  if (roots.length === 0) return
  const existing = await prisma.expense.findMany({
    where: { businessId, date: { gte: start, lt: end }, parentId: { in: roots.map((r) => r.id) } },
    select: { parentId: true },
  })
  const done = new Set(existing.map((e) => e.parentId))
  const z = new TZDate(start, timezone)
  const toCreate = roots
    .filter((r) => !done.has(r.id))
    .map((r) => {
      const rz = new TZDate(r.date, timezone)
      const lastDay = new Date(Date.UTC(z.getFullYear(), z.getMonth() + 1, 0)).getUTCDate()
      const day = Math.min(rz.getDate(), lastDay)
      return {
        businessId,
        description: r.description,
        category: r.category,
        date: new TZDate(z.getFullYear(), z.getMonth(), day, 12, 0, 0, timezone),
        amountCents: r.amountCents,
        type: r.type,
        recurrence: "MONTHLY" as const,
        parentId: r.id,
      }
    })
  if (toCreate.length) await prisma.expense.createMany({ data: toCreate })
}

export async function getExpensesData(
  businessId: string,
  ym: string | undefined,
  now: Date,
  timezone: string,
) {
  const range = monthRange(ym, now, timezone)
  const prevStart = addMonths(range.start, -1)
  await ensureRecurringForMonth(businessId, range.start, range.end, timezone)

  const [expenses, prevExpenses, appointments, categories] = await Promise.all([
    prisma.expense.findMany({
      where: { businessId, date: { gte: range.start, lt: range.end } },
      orderBy: { date: "asc" },
    }),
    prisma.expense.findMany({ where: { businessId, date: { gte: prevStart, lt: range.start } } }),
    prisma.appointment.findMany({
      where: { businessId, status: "DONE", startsAt: { gte: range.start, lt: range.end } },
      select: {
        startsAt: true,
        endsAt: true,
        status: true,
        priceCents: true,
        serviceId: true,
        service: { select: { title: true } },
      },
    }),
    prisma.expense.findMany({
      where: { businessId },
      select: { category: true },
      distinct: ["category"],
    }),
  ])

  const fin: FinanceExpense[] = expenses.map((e) => ({
    date: e.date,
    amountCents: e.amountCents,
    type: e.type,
    category: e.category,
  }))
  const prevFin: FinanceExpense[] = prevExpenses.map((e) => ({
    date: e.date,
    amountCents: e.amountCents,
    type: e.type,
    category: e.category,
  }))
  const appts: FinanceAppointment[] = appointments.map((a) => ({
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    status: a.status,
    priceCents: a.priceCents,
    serviceId: a.serviceId,
    serviceTitle: a.service.title,
  }))

  const summary = summarize(range, appts, fin)
  const prevTotal = prevFin.reduce((s, e) => s + e.amountCents, 0)

  return {
    range,
    expenses,
    summary,
    prevTotalCents: prevTotal,
    fixedCount: expenses.filter((e) => e.type === "FIXED").length,
    variableCount: expenses.filter((e) => e.type === "VARIABLE").length,
    recurringCount: expenses.filter((e) => e.recurrence === "MONTHLY").length,
    byCategory: expensesByCategory(range, fin),
    categories: categories.map((c) => c.category),
  }
}
