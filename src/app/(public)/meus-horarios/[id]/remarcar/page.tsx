import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ChevronLeftIcon, SparklesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InfoBox } from "@/components/ui/info-box"
import { MonthCalendar } from "@/features/booking/components/month-calendar"
import type { PublicSlot } from "@/features/booking/components/slot-selector"
import { monthAvailability, parseYmd, slotsForDay } from "@/features/booking/core"
import { dayKey } from "@/features/agenda/queries"
import { RescheduleSlots } from "@/features/client-area/components/reschedule-slots"
import { canChange, getMyAppointment, resolveClientAccess } from "@/features/client-area/queries"
import { listPublicServices } from "@/features/public/queries"
import { fmtDuration, fmtLongDate, fmtShortDate, fmtTime } from "@/lib/dates"
import { formatPrice } from "@/lib/money"

export const metadata: Metadata = { title: "Remarcar" }

/*
 * Editar agendamento (M8): trocar dia/horário (?data=) ou trocar serviço (?trocar=1 → lista;
 * ?servico=<id> → horários recalculados pela nova duração).
 */
export default async function RemarcarPage({
  params,
  searchParams,
}: PageProps<"/meus-horarios/[id]/remarcar">) {
  const { id } = await params
  const sp = await searchParams
  const token = typeof sp.t === "string" ? sp.t : null
  const access = await resolveClientAccess(token)
  if (!access) redirect("/entrar?next=%2Fmeus-horarios")
  const a = await getMyAppointment(id, access)
  if (!a) notFound()
  const q = token ? `?t=${token}` : ""
  const backHref = `/meus-horarios${q}`
  const now = new Date()
  const tz = a.business.timezone
  const allowed =
    (a.status === "PENDING" || a.status === "CONFIRMED") &&
    canChange(a.startsAt, a.business.cancelMinHours, now)

  const withParams = (extra: Record<string, string>) => {
    const u = new URLSearchParams()
    if (token) u.set("t", token)
    for (const [k, v] of Object.entries(extra)) u.set(k, v)
    return `/meus-horarios/${a.id}/remarcar?${u.toString()}`
  }

  /* ---- trocar serviço: lista ---- */
  if (sp.trocar === "1") {
    const services = await listPublicServices(a.businessId)
    return (
      <main className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-5 pt-8 pb-10 lg:pt-12">
        <Header backHref={backHref} eyebrow="Editar agendamento" title="Trocar serviço" />
        <p className="type-body text-secondary-txt">
          Os horários serão recalculados pela duração do novo serviço.
        </p>
        <ul className="flex flex-col gap-2">
          {services.map((s) => (
            <li key={s.id}>
              <Link
                href={withParams({ servico: s.id })}
                className="bg-surface border-subtle hover:bg-surface-2 flex items-center gap-4 rounded-md border p-4 transition-colors"
                aria-current={s.id === a.serviceId ? "true" : undefined}
              >
                <span className="bg-magenta-500/18 flex size-10 shrink-0 items-center justify-center rounded-sm text-pink-300">
                  <SparklesIcon className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="type-body-medium truncate">
                    {s.title}
                    {s.id === a.serviceId ? " · atual" : ""}
                  </span>
                  <span className="type-body text-secondary-txt">
                    {fmtDuration(s.durationMin)} · {formatPrice(s.priceCents, s.priceFrom)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    )
  }

  const serviceId = typeof sp.servico === "string" ? sp.servico : a.serviceId
  const service =
    serviceId === a.serviceId
      ? a.service
      : (await listPublicServices(a.businessId)).find((s) => s.id === serviceId)
  if (!service) notFound()

  const todayYmd = dayKey(now, tz)
  const requestedYmd = typeof sp.data === "string" && parseYmd(sp.data, tz) ? sp.data : null
  const requestedYm = typeof sp.mes === "string" && /^\d{4}-\d{2}$/.test(sp.mes) ? sp.mes : null
  const selectedYmd =
    requestedYmd && requestedYmd >= todayYmd
      ? requestedYmd
      : requestedYm
        ? null
        : dayKey(a.startsAt, tz)
  const ym = selectedYmd?.slice(0, 7) ?? requestedYm ?? todayYmd.slice(0, 7)
  const [year, month] = ym.split("-").map(Number)
  const availability = await monthAvailability(a.businessId, service.id, year, month - 1, {
    now,
    ignoreAppointmentId: a.id,
  })
  const slots: PublicSlot[] = selectedYmd
    ? (
        await slotsForDay(a.businessId, service.id, selectedYmd, {
          now,
          minNoticeMin: 30,
          ignoreAppointmentId: a.id,
        })
      ).map((s) => ({
        iso: s.startsAt.toISOString(),
        label: fmtTime(s.startsAt, tz),
        endLabel: fmtTime(s.serviceEndsAt, tz),
        period: s.startMin < 12 * 60 ? "Manhã" : s.startMin < 18 * 60 ? "Tarde" : "Noite",
      }))
    : []
  const selectedDate = selectedYmd ? parseYmd(selectedYmd, tz)! : null

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-5 pt-8 pb-10 lg:px-10 lg:pt-12">
      <Header
        backHref={backHref}
        eyebrow="Editar agendamento"
        title={
          service.id === a.serviceId ? "Trocar dia ou horário" : `Novo serviço: ${service.title}`
        }
      />
      <p className="type-body text-secondary-txt">
        Atual: {a.service.title} · {fmtShortDate(a.startsAt, tz)} às {fmtTime(a.startsAt, tz)}
      </p>
      {!allowed ? (
        <InfoBox tone="warning">
          O prazo de alteração gratuita ({a.business.cancelMinHours} h antes) já passou ou o
          agendamento não está ativo. Fale com a {a.business.name.split(" ")[0]} no WhatsApp.
        </InfoBox>
      ) : null}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[400px_1fr] lg:items-start">
        <MonthCalendar
          year={year}
          monthIndex={month - 1}
          availability={availability}
          selectedYmd={selectedYmd}
          todayYmd={todayYmd}
          hrefForDay={(ymd) =>
            withParams({
              ...(service.id !== a.serviceId ? { servico: service.id } : {}),
              data: ymd,
            })
          }
          hrefForMonth={(m) =>
            withParams({ ...(service.id !== a.serviceId ? { servico: service.id } : {}), mes: m })
          }
          minYm={todayYmd.slice(0, 7)}
        />
        <div className="bg-surface border-subtle rounded-md border p-5">
          {allowed ? (
            <RescheduleSlots
              appointmentId={a.id}
              token={token}
              serviceId={service.id}
              slots={slots}
              dayLabel={selectedDate ? fmtLongDate(selectedDate, tz) : "Escolha um dia"}
              backHref={backHref}
              note={`Horários calculados para ${fmtDuration(service.durationMin).replace("h00", "h")} de serviço. Seu horário atual é ignorado no cálculo.`}
            />
          ) : (
            <Button asChild variant="secondary">
              <Link href={backHref}>Voltar</Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}

function Header({
  backHref,
  eyebrow,
  title,
}: {
  backHref: string
  eyebrow: string
  title: string
}) {
  return (
    <header className="flex items-center gap-3">
      <Button asChild variant="soft" size="icon-sm" aria-label="Voltar">
        <Link href={backHref}>
          <ChevronLeftIcon />
        </Link>
      </Button>
      <div>
        <p className="display-label text-pink-300">{eyebrow}</p>
        <h1 className="type-h2">{title}</h1>
      </div>
    </header>
  )
}
