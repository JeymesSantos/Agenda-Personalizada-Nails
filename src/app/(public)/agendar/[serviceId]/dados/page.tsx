import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  CalendarIcon,
  ChevronLeftIcon,
  ClockIcon,
  CreditCardIcon,
  SparklesIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Stepper } from "@/components/ui/stepper"
import { SummaryList, SummaryRow } from "@/components/ui/summary-list"
import { GuestBookingForm } from "@/features/booking/components/guest-form"
import { getPublicBusinessOrThrow, getPublicService } from "@/features/public/queries"
import { fmtLongDate, fmtRange } from "@/lib/dates"
import { formatPrice } from "@/lib/money"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"

export const metadata: Metadata = { title: "Seus dados" }

/* Passo 3 de 3 — Seus dados (M5). */
export default async function DadosPage({
  params,
  searchParams,
}: PageProps<"/agendar/[serviceId]/dados">) {
  const { serviceId } = await params
  const sp = await searchParams
  const b = await getPublicBusinessOrThrow()
  const service = await getPublicService(b.id, serviceId)
  if (!service) notFound()
  const iso = typeof sp.h === "string" ? sp.h : ""
  const startsAt = iso ? new Date(iso) : null
  if (!startsAt || Number.isNaN(startsAt.getTime())) redirect(`/agendar/${service.id}/horario`)
  const serviceEndsAt = new Date(startsAt.getTime() + service.durationMin * 60_000)

  const user = await getCurrentUser()
  const member =
    user?.role === "CLIENT"
      ? await prisma.user.findUnique({
          where: { id: user.id },
          select: { name: true, whatsapp: true },
        })
      : null
  const current = `/agendar/${service.id}/dados?h=${encodeURIComponent(iso)}`

  const summary = (
    <SummaryList title="Resumo">
      <SummaryRow icon={<SparklesIcon />} label="Serviço">
        {service.title}
      </SummaryRow>
      <SummaryRow icon={<CalendarIcon />} label="Data">
        {fmtLongDate(startsAt, b.timezone)}
      </SummaryRow>
      <SummaryRow icon={<ClockIcon />} label="Horário">
        {fmtRange(startsAt, serviceEndsAt, b.timezone)}
      </SummaryRow>
      <SummaryRow icon={<CreditCardIcon />} label="Valor" highlight>
        {formatPrice(service.priceCents, service.priceFrom)}
      </SummaryRow>
    </SummaryList>
  )

  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-5 pt-6 pb-10 lg:pt-12">
      <Stepper
        steps={["Serviço", "Data e horário", "Seus dados"]}
        current={2}
        className="hidden lg:flex"
      />
      <header className="flex items-center gap-3">
        <Button asChild variant="soft" size="icon-sm" aria-label="Voltar" className="lg:hidden">
          <Link
            href={`/agendar/${service.id}/horario?data=${iso.slice(0, 10)}&h=${encodeURIComponent(iso)}`}
          >
            <ChevronLeftIcon />
          </Link>
        </Button>
        <div>
          <p className="display-label text-pink-300">Passo 3 de 3</p>
          <h1 className="type-h2 lg:type-h1">Seus dados</h1>
        </div>
      </header>
      <GuestBookingForm
        serviceId={service.id}
        startsAtIso={startsAt.toISOString()}
        loginHref={`/entrar?next=${encodeURIComponent(current)}`}
        signupHref={`/cadastro?next=${encodeURIComponent(current)}`}
        member={member}
        summary={summary}
        footerText={`Você recebe a confirmação e um link para remarcar no WhatsApp. Cancelamento gratuito até ${b.cancelMinHours} h antes.`}
      />
    </main>
  )
}
