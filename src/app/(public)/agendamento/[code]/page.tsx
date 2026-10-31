import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CreditCardIcon,
  HomeIcon,
  SparklesIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { SummaryList, SummaryRow } from "@/components/ui/summary-list"
import { getAppointmentByCode } from "@/features/booking/queries"
import { fmtShortDate, fmtTime, fmt } from "@/lib/dates"
import { formatCents } from "@/lib/money"

export const metadata: Metadata = { title: "Horário confirmado" }

const WEEKDAY_LONG = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]

/* Agendamento confirmado — comprovante (M6). */
export default async function AgendamentoPage({
  params,
  searchParams,
}: PageProps<"/agendamento/[code]">) {
  const { code } = await params
  const sp = await searchParams
  const token = typeof sp.t === "string" ? sp.t : null
  const a = await getAppointmentByCode(code, token)
  if (!a) notFound()
  const tz = a.business.timezone
  const weekday = WEEKDAY_LONG[Number(fmt(a.startsAt, "i", tz)) % 7]
  const manage = token ? `/meus-horarios?t=${token}` : "/meus-horarios"
  const icsHref = `/agendamento/${a.code}/ics${token ? `?t=${token}` : ""}`
  const cancelled = a.status === "CANCELLED"

  return (
    <main className="bg-gradient-hero mx-auto flex w-full max-w-[560px] flex-col items-center gap-6 px-5 pt-14 pb-12 text-center lg:pt-20">
      <span className="bg-gradient-primary glow-primary flex size-24 items-center justify-center rounded-full text-pink-100">
        <CheckIcon className="size-10" strokeWidth={2} />
      </span>
      <div className="flex flex-col gap-2">
        <p className="display-label text-pink-300">{cancelled ? "Cancelado" : "Tudo certo"}</p>
        <h1 className="type-h1">
          {cancelled ? "Este horário foi cancelado" : "Horário confirmado!"}
        </h1>
        {!cancelled ? (
          <p className="type-body-l text-secondary-txt">
            Te esperamos na {weekday}. Um lembrete chega no seu WhatsApp 24 h antes.
          </p>
        ) : null}
      </div>

      <SummaryList title={`Comprovante · #${a.code}`} className="w-full text-left">
        <SummaryRow icon={<SparklesIcon />} label="Serviço">
          {a.service.title}
        </SummaryRow>
        <SummaryRow icon={<CalendarIcon />} label="Data">
          {fmtShortDate(a.startsAt, tz)}
        </SummaryRow>
        <SummaryRow icon={<ClockIcon />} label="Horário">
          {fmtTime(a.startsAt, tz)} – {fmtTime(a.serviceEndsAt, tz)}
        </SummaryRow>
        {a.business.addressLine ? (
          <SummaryRow icon={<HomeIcon />} label="Local">
            {a.business.addressLine.split("·")[0].trim()}
            {a.business.neighborhood ? ` · ${a.business.neighborhood}` : ""}
          </SummaryRow>
        ) : null}
        <SummaryRow icon={<CreditCardIcon />} label="Pagamento" highlight>
          No local · {formatCents(a.priceCents)}
        </SummaryRow>
      </SummaryList>

      {!cancelled ? (
        <Button asChild variant="secondary" size="lg" className="w-full">
          <a href={icsHref}>Adicionar ao calendário</a>
        </Button>
      ) : null}
      <Button asChild variant="link">
        <Link href={manage}>Ver meus horários</Link>
      </Button>
    </main>
  )
}
