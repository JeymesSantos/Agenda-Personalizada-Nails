import { TZDate } from "@date-fns/tz"
import {
  addDays,
  addMonths,
  addYears,
  differenceInMinutes,
  format,
  isSameDay,
  startOfWeek,
} from "date-fns"
import { ptBR } from "date-fns/locale"

export const DEFAULT_TZ = "America/Sao_Paulo"

export type PeriodKind = "dia" | "semana" | "mes" | "ano"

export type Period = {
  kind: PeriodKind
  /** Início (inclusivo). */
  start: Date
  /** Fim (exclusivo). */
  end: Date
  label: string
}

export function tz(date: Date, timezone = DEFAULT_TZ): TZDate {
  return new TZDate(date, timezone)
}

export function dayStart(date: Date, timezone = DEFAULT_TZ): TZDate {
  const z = tz(date, timezone)
  return new TZDate(z.getFullYear(), z.getMonth(), z.getDate(), 0, 0, 0, timezone)
}

export function monthStart(date: Date, timezone = DEFAULT_TZ): TZDate {
  const z = tz(date, timezone)
  return new TZDate(z.getFullYear(), z.getMonth(), 1, 0, 0, 0, timezone)
}

/** Período atual para o seletor Dia / Semana / Mês / Ano do painel. */
export function periodFor(kind: PeriodKind, now: Date, timezone = DEFAULT_TZ): Period {
  const z = tz(now, timezone)
  switch (kind) {
    case "dia": {
      const start = dayStart(now, timezone)
      return {
        kind,
        start,
        end: addDays(start, 1),
        label: capitalize(format(start, "EEEE, d 'de' MMMM", { locale: ptBR })),
      }
    }
    case "semana": {
      const start = new TZDate(startOfWeek(z, { weekStartsOn: 1 }), timezone)
      const s = new TZDate(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        0,
        0,
        0,
        timezone,
      )
      const end = addDays(s, 7)
      return {
        kind,
        start: s,
        end,
        label: `${format(s, "d MMM", { locale: ptBR })} – ${format(addDays(s, 6), "d MMM", { locale: ptBR })}`,
      }
    }
    case "mes": {
      const start = monthStart(now, timezone)
      return {
        kind,
        start,
        end: addMonths(start, 1),
        label: capitalize(format(start, "MMMM yyyy", { locale: ptBR })),
      }
    }
    case "ano": {
      const start = new TZDate(z.getFullYear(), 0, 1, 0, 0, 0, timezone)
      return { kind, start, end: addYears(start, 1), label: format(start, "yyyy") }
    }
  }
}

/** Período imediatamente anterior, com a mesma duração lógica. */
export function previousPeriod(period: Period, timezone = DEFAULT_TZ): Period {
  switch (period.kind) {
    case "dia":
      return periodFor("dia", addDays(period.start, -1), timezone)
    case "semana":
      return periodFor("semana", addDays(period.start, -7), timezone)
    case "mes":
      return periodFor("mes", addMonths(period.start, -1), timezone)
    case "ano":
      return periodFor("ano", addYears(period.start, -1), timezone)
  }
}

export function isPeriodKind(value: unknown): value is PeriodKind {
  return value === "dia" || value === "semana" || value === "mes" || value === "ano"
}

/* ---------- formatação em pt-BR ---------- */

export function fmt(date: Date, pattern: string, timezone = DEFAULT_TZ): string {
  return format(tz(date, timezone), pattern, { locale: ptBR })
}

/** "14:15" */
export function fmtTime(date: Date, timezone = DEFAULT_TZ): string {
  return fmt(date, "HH:mm", timezone)
}

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

/** "Qui, 5/11" (date-fns pt-BR não tem a forma "Sáb", por isso a tabela própria) */
export function fmtShortDate(date: Date, timezone = DEFAULT_TZ): string {
  const z = tz(date, timezone)
  return `${WEEKDAY_SHORT[z.getDay()]}, ${z.getDate()}/${z.getMonth() + 1}`
}

/** "Quinta, 5 de novembro" */
export function fmtLongDate(date: Date, timezone = DEFAULT_TZ): string {
  return capitalize(fmt(date, "EEEE, d 'de' MMMM", timezone))
}

/** "TERÇA, 27 DE OUTUBRO" para o rótulo em caps do painel. */
export function fmtHeaderDate(date: Date, timezone = DEFAULT_TZ): string {
  return fmt(date, "EEEE, d 'de' MMMM", timezone)
}

/** "2h00", "1h15", "30 min" */
export function fmtDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${String(m).padStart(2, "0")}`
}

/** "14:15 – 16:15" */
export function fmtRange(start: Date, end: Date, timezone = DEFAULT_TZ): string {
  return `${fmtTime(start, timezone)} – ${fmtTime(end, timezone)}`
}

export function greeting(now: Date, timezone = DEFAULT_TZ): string {
  const hour = tz(now, timezone).getHours()
  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}

export function isToday(date: Date, now: Date, timezone = DEFAULT_TZ): boolean {
  return isSameDay(tz(date, timezone), tz(now, timezone))
}

export function minutesBetween(a: Date, b: Date): number {
  return differenceInMinutes(b, a)
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
