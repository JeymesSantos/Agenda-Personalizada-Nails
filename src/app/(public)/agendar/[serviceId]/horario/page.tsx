import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeftIcon, SparklesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Stepper } from "@/components/ui/stepper"
import { MonthCalendar } from "@/features/booking/components/month-calendar"
import { SlotSelector, type PublicSlot } from "@/features/booking/components/slot-selector"
import { monthAvailability, parseYmd, slotsForDay } from "@/features/booking/core"
import { dayKey } from "@/features/agenda/queries"
import { getPublicBusinessOrThrow, getPublicService } from "@/features/public/queries"
import { fmtDuration, fmtLongDate, fmtShortDate, fmtTime, tz } from "@/lib/dates"
import { formatPrice } from "@/lib/money"

export const metadata: Metadata = { title: "Data e horário" }

const MIN_NOTICE_MIN = 30

/** Primeiro dia com horários a partir de hoje, no mês dado (ou null). */
function firstAvailable(av: Record<string, "available" | "full" | "closed">, fromYmd: string) {
  return Object.keys(av)
    .sort()
    .find((k) => k >= fromYmd && av[k] === "available")
}

/* Passo 2 de 3 — Data e horário (M4 mobile, D2 desktop). */
export default async function HorarioPage({
  params,
  searchParams,
}: PageProps<"/agendar/[serviceId]/horario">) {
  const { serviceId } = await params
  const sp = await searchParams
  const b = await getPublicBusinessOrThrow()
  const service = await getPublicService(b.id, serviceId)
  if (!service) notFound()

  const now = new Date()
  const todayYmd = dayKey(now, b.timezone)
  const requestedYmd = typeof sp.data === "string" && parseYmd(sp.data, b.timezone) ? sp.data : null
  const requestedYm = typeof sp.mes === "string" && /^\d{4}-\d{2}$/.test(sp.mes) ? sp.mes : null
  const baseYm = requestedYmd?.slice(0, 7) ?? requestedYm ?? todayYmd.slice(0, 7)
  const [year, month] = baseYm.split("-").map(Number)

  let availability = await monthAvailability(b.id, service.id, year, month - 1, { now })
  let selectedYmd = requestedYmd && requestedYmd >= todayYmd ? requestedYmd : null
  let calYear = year
  let calMonth = month - 1
  if (!selectedYmd && !requestedYm) {
    /* sem data na URL: cai no primeiro dia com horários, olhando até 2 meses à frente */
    selectedYmd = firstAvailable(availability, todayYmd) ?? null
    if (!selectedYmd) {
      const n = month === 12 ? { y: year + 1, m: 0 } : { y: year, m: month }
      const nextAv = await monthAvailability(b.id, service.id, n.y, n.m, { now })
      const found = firstAvailable(nextAv, todayYmd)
      if (found) {
        availability = nextAv
        selectedYmd = found
        calYear = n.y
        calMonth = n.m
      }
    }
  }

  const slots: PublicSlot[] = selectedYmd
    ? (await slotsForDay(b.id, service.id, selectedYmd, { now, minNoticeMin: MIN_NOTICE_MIN })).map(
        (s) => ({
          iso: s.startsAt.toISOString(),
          label: fmtTime(s.startsAt, b.timezone),
          endLabel: fmtTime(s.serviceEndsAt, b.timezone),
          period: s.startMin < 12 * 60 ? "Manhã" : s.startMin < 18 * 60 ? "Tarde" : "Noite",
        }),
      )
    : []

  const selectedDate = selectedYmd ? parseYmd(selectedYmd, b.timezone)! : null
  const dayLabel = selectedDate ? fmtLongDate(selectedDate, b.timezone) : "Escolha um dia"
  const shortDayLabel = selectedDate ? fmtShortDate(selectedDate, b.timezone) : ""
  const initialIso = typeof sp.h === "string" ? sp.h : null
  const hrefForDay = (ymd: string) => `/agendar/${service.id}/horario?data=${ymd}`
  const hrefForMonth = (ym: string) => `/agendar/${service.id}/horario?mes=${ym}`
  const minYm = todayYmd.slice(0, 7)
  void tz

  const calendar = (
    <MonthCalendar
      year={calYear}
      monthIndex={calMonth}
      availability={availability}
      selectedYmd={selectedYmd}
      todayYmd={todayYmd}
      hrefForDay={hrefForDay}
      hrefForMonth={hrefForMonth}
      minYm={minYm}
    />
  )

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-5 pt-6 pb-40 lg:px-10 lg:pt-12 lg:pb-16">
      <Stepper
        steps={["Serviço", "Data e horário", "Seus dados"]}
        current={1}
        className="hidden lg:flex"
      />

      {/* cabeçalho mobile (M4) */}
      <header className="flex items-center gap-3 lg:hidden">
        <Button asChild variant="soft" size="icon-sm" aria-label="Voltar">
          <Link href="/agendar">
            <ChevronLeftIcon />
          </Link>
        </Button>
        <div>
          <p className="display-label text-pink-300">Passo 2 de 3</p>
          <h1 className="type-h2">Data e horário</h1>
        </div>
      </header>
      <div className="bg-surface border-subtle flex items-center gap-3 rounded-md border p-3 lg:hidden">
        <span className="bg-gradient-photo flex size-12 shrink-0 items-center justify-center rounded-sm text-pink-100">
          <SparklesIcon className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="type-body-medium truncate">{service.title}</span>
          <span className="type-body text-secondary-txt">
            {fmtDuration(service.durationMin)} ·{" "}
            {formatPrice(service.priceCents, service.priceFrom)}
          </span>
        </span>
        <Link href="/agendar" className="type-body-medium pr-1 text-pink-300">
          Trocar
        </Link>
      </div>

      {/* cabeçalho desktop (D2) */}
      <header className="hidden lg:block">
        <p className="display-label text-pink-300">Passo 2 de 3</p>
        <h1 className="type-h1 mt-2">Escolha o dia e o horário</h1>
      </header>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[336px_minmax(0,1fr)_280px] lg:items-start xl:grid-cols-[400px_minmax(0,1fr)_340px]">
        {calendar}
        <SlotSelector
          serviceId={service.id}
          serviceTitle={service.title}
          durationMin={service.durationMin}
          priceCents={service.priceCents}
          priceFrom={service.priceFrom}
          dayLabel={dayLabel}
          shortDayLabel={shortDayLabel}
          slots={slots}
          initialIso={initialIso}
          cancelMinHours={b.cancelMinHours}
        />
      </div>
    </main>
  )
}
