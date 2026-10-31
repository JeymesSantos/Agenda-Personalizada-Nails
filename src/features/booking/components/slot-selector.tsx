"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarIcon, ClockIcon, SparklesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InfoBox } from "@/components/ui/info-box"
import { SlotButton } from "@/components/ui/slot-button"
import { SummaryRow } from "@/components/ui/summary-list"
import { fmtDuration } from "@/lib/dates"
import { formatPrice } from "@/lib/money"

export type PublicSlot = {
  iso: string
  label: string
  endLabel: string
  period: "Manhã" | "Tarde" | "Noite"
}

/*
 * Lista de horários do passo 2 (M4/D2) + barra/cartão de continuação.
 * A seleção do horário é estado local; o dia vem da URL (?data=).
 */
export function SlotSelector({
  serviceId,
  serviceTitle,
  durationMin,
  bufferMin,
  priceCents,
  priceFrom,
  dayLabel,
  shortDayLabel,
  slots,
  initialIso,
  cancelMinHours,
}: {
  serviceId: string
  serviceTitle: string
  durationMin: number
  bufferMin: number
  priceCents: number
  priceFrom: boolean
  dayLabel: string
  shortDayLabel: string
  slots: PublicSlot[]
  initialIso: string | null
  cancelMinHours: number
}) {
  const [selected, setSelected] = useState<string | null>(
    initialIso && slots.some((s) => s.iso === initialIso) ? initialIso : null,
  )
  const chosen = slots.find((s) => s.iso === selected) ?? null
  const groups = ["Manhã", "Tarde", "Noite"] as const
  const nextHref = chosen ? `/agendar/${serviceId}/dados?h=${encodeURIComponent(chosen.iso)}` : null

  const slotList = (
    <div className="flex flex-col gap-5">
      {slots.length === 0 ? (
        <p className="type-body text-secondary-txt">
          Nenhum horário livre neste dia para este serviço. Escolha outro dia no calendário.
        </p>
      ) : (
        groups.map((g) => {
          const list = slots.filter((s) => s.period === g)
          if (list.length === 0) return null
          return (
            <div key={g} className="flex flex-col gap-2.5">
              <p className="type-caption text-secondary-txt">{g}</p>
              <div className="grid grid-cols-3 gap-2.5 sm:flex sm:flex-wrap">
                {list.map((s) => (
                  <SlotButton
                    key={s.iso}
                    selected={selected === s.iso}
                    onClick={() => setSelected(s.iso)}
                  >
                    {s.label}
                  </SlotButton>
                ))}
              </div>
            </div>
          )
        })
      )}
      <InfoBox tone="info">
        Horários calculados para {fmtDuration(durationMin).replace("h00", "h")} de serviço
        {bufferMin ? ` + ${bufferMin} min de reorganização` : ""}. Atualizados em tempo real.
      </InfoBox>
    </div>
  )

  return (
    <>
      {/* ---- mobile (M4): horários + barra fixa ---- */}
      <div className="flex flex-col gap-4 lg:hidden">
        <h2 className="type-h3">{dayLabel}</h2>
        {slotList}
      </div>
      <div className="bg-surface/95 border-subtle pb-safe fixed inset-x-0 bottom-[72px] z-30 border-t px-5 pt-3 pb-3 backdrop-blur lg:hidden">
        <p className="type-body text-secondary-txt mb-3 text-center">
          {chosen
            ? `${shortDayLabel} às ${chosen.label} · término previsto ${chosen.endLabel}`
            : "Escolha um horário"}
        </p>
        <Button asChild={Boolean(nextHref)} size="lg" className="w-full" disabled={!nextHref}>
          {nextHref ? <Link href={nextHref}>Continuar</Link> : <span>Continuar</span>}
        </Button>
      </div>

      {/* ---- desktop (D2): coluna de horários + cartão de resumo ---- */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[1fr_360px]">
        <div className="bg-surface border-subtle flex flex-col gap-4 rounded-md border p-6">
          <h2 className="type-h3">{dayLabel}</h2>
          {slotList}
        </div>
        <aside className="bg-surface border-subtle flex flex-col gap-4 self-start rounded-md border p-6">
          <p className="type-caption text-secondary-txt">Resumo</p>
          <div className="flex items-center gap-3">
            <span className="bg-gradient-photo flex size-12 shrink-0 items-center justify-center rounded-sm text-pink-100">
              <SparklesIcon className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="type-body-medium truncate">{serviceTitle}</span>
              <span className="type-body text-secondary-txt">
                {fmtDuration(durationMin)}
                {bufferMin ? ` · +${bufferMin} min` : ""}
              </span>
            </span>
            <Link href="/agendar" className="type-body-medium text-pink-300 hover:underline">
              Trocar
            </Link>
          </div>
          <dl className="border-subtle flex flex-col gap-3 border-t pt-4">
            <SummaryRow icon={<CalendarIcon />} label="Data">
              {dayLabel}
            </SummaryRow>
            <SummaryRow icon={<ClockIcon />} label="Horário">
              {chosen ? `${chosen.label} – ${chosen.endLabel}` : "—"}
            </SummaryRow>
          </dl>
          <div className="border-subtle flex items-center justify-between border-t pt-4">
            <span className="type-body-medium">Total</span>
            <span className="type-h2 text-pink-300">{formatPrice(priceCents, priceFrom)}</span>
          </div>
          <Button asChild={Boolean(nextHref)} size="lg" disabled={!nextHref}>
            {nextHref ? <Link href={nextHref}>Continuar</Link> : <span>Continuar</span>}
          </Button>
          <p className="type-body text-secondary-txt">
            Pagamento no local. Cancelamento gratuito até {cancelMinHours} h antes.
          </p>
        </aside>
      </div>
    </>
  )
}
