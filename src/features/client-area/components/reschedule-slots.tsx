"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { InfoBox } from "@/components/ui/info-box"
import { SlotButton } from "@/components/ui/slot-button"
import type { PublicSlot } from "@/features/booking/components/slot-selector"
import { rescheduleMyAppointmentAction } from "../actions"

/* Lista de horários da remarcação + confirmação (reaproveita o passo 2). */
export function RescheduleSlots({
  appointmentId,
  token,
  serviceId,
  slots,
  dayLabel,
  backHref,
  note,
}: {
  appointmentId: string
  token: string | null
  serviceId: string
  slots: PublicSlot[]
  dayLabel: string
  backHref: string
  note: string
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const groups = ["Manhã", "Tarde", "Noite"] as const

  return (
    <div className="flex flex-col gap-5">
      <h2 className="type-h3">{dayLabel}</h2>
      {slots.length === 0 ? (
        <p className="type-body text-secondary-txt">
          Nenhum horário livre neste dia. Escolha outro dia.
        </p>
      ) : (
        groups.map((g) => {
          const list = slots.filter((s) => s.period === g)
          if (!list.length) return null
          return (
            <div key={g} className="flex flex-col gap-2.5">
              <p className="type-caption text-secondary-txt">{g}</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2.5">
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
      <InfoBox tone="info">{note}</InfoBox>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => router.push(backHref)}>
          Voltar
        </Button>
        <Button
          disabled={!selected || pending}
          onClick={() =>
            startTransition(async () => {
              const r = await rescheduleMyAppointmentAction(
                appointmentId,
                token,
                serviceId,
                selected!,
              )
              if (r.error) {
                toast.error(r.error)
                return
              }
              toast.success(r.success)
              router.push(backHref)
            })
          }
        >
          {pending ? "Remarcando…" : "Confirmar remarcação"}
        </Button>
      </div>
    </div>
  )
}
