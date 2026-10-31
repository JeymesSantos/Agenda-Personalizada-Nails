import Link from "next/link"
import { cn } from "cn"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import type { DayAvailability } from "@/lib/scheduling"

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"]
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

/*
 * Calendário mensal do passo 2 (M4/D2): ponto verde = com horários, ponto cinza = lotado,
 * riscado = fechado, círculo magenta = dia selecionado. Navegação por mês via links.
 */
export function MonthCalendar({
  year,
  monthIndex,
  availability,
  selectedYmd,
  todayYmd,
  hrefForDay,
  hrefForMonth,
  minYm,
}: {
  year: number
  monthIndex: number
  availability: Record<string, DayAvailability>
  selectedYmd: string | null
  todayYmd: string
  hrefForDay: (ymd: string) => string
  hrefForMonth: (ym: string) => string
  /** "YYYY-MM" do mês atual: não navega para trás dele */
  minYm: string
}) {
  const first = new Date(Date.UTC(year, monthIndex, 1))
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const leading = first.getUTCDay()
  const ym = `${year}-${String(monthIndex + 1).padStart(2, "0")}`
  const prev =
    monthIndex === 0 ? `${year - 1}-12` : `${year}-${String(monthIndex).padStart(2, "0")}`
  const next =
    monthIndex === 11 ? `${year + 1}-01` : `${year}-${String(monthIndex + 2).padStart(2, "0")}`
  const canPrev = prev >= minYm

  return (
    <div className="bg-surface border-subtle flex flex-col gap-4 rounded-md border p-4">
      <div className="flex items-center justify-between">
        {canPrev ? (
          <Link
            href={hrefForMonth(prev)}
            aria-label="Mês anterior"
            className="text-secondary-txt hover:text-foreground flex size-9 items-center justify-center rounded-full"
          >
            <ChevronLeftIcon className="size-5" />
          </Link>
        ) : (
          <span className="size-9" />
        )}
        <span className="type-h3">
          {MONTHS[monthIndex]} {year}
        </span>
        <Link
          href={hrefForMonth(next)}
          aria-label="Próximo mês"
          className="text-secondary-txt hover:text-foreground flex size-9 items-center justify-center rounded-full"
        >
          <ChevronRightIcon className="size-5" />
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-y-2">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="type-caption text-muted-txt text-center">
            {w}
          </div>
        ))}
        {Array.from({ length: leading }).map((_, i) => (
          <div key={`lead-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const ymd = `${ym}-${String(day).padStart(2, "0")}`
          const state = availability[ymd] ?? "closed"
          const past = ymd < todayYmd
          const selected = ymd === selectedYmd
          const disabled = past || state === "closed"
          const inner = (
            <span
              className={cn(
                "type-body-medium relative flex size-10 flex-col items-center justify-center rounded-full",
                selected && "bg-magenta-500 glow-primary text-pink-100",
                !selected && disabled && "text-muted-txt line-through",
                !selected && !disabled && "text-foreground",
              )}
            >
              {day}
              {!disabled && !selected ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute bottom-1 size-1 rounded-full",
                    state === "available" ? "bg-success" : "bg-muted-txt",
                  )}
                />
              ) : null}
            </span>
          )
          return (
            <div key={ymd} className="flex justify-center">
              {disabled ? (
                <span aria-disabled className="cursor-not-allowed">
                  {inner}
                </span>
              ) : (
                <Link
                  href={hrefForDay(ymd)}
                  aria-label={`Dia ${day}`}
                  aria-current={selected ? "date" : undefined}
                  className="hover:bg-surface-2 rounded-full"
                >
                  {inner}
                </Link>
              )}
            </div>
          )
        })}
      </div>
      <ul className="type-body text-secondary-txt flex items-center gap-4">
        <li className="flex items-center gap-1.5">
          <span className="bg-success size-1.5 rounded-full" /> Com horários
        </li>
        <li className="flex items-center gap-1.5">
          <span className="bg-muted-txt size-1.5 rounded-full" /> Lotado
        </li>
        <li className="flex items-center gap-1.5">
          <span className="text-muted-txt line-through">20</span> Fechado
        </li>
      </ul>
    </div>
  )
}
