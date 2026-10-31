"use client"

import { useEffect, useState, useTransition } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SlotButton } from "@/components/ui/slot-button"
import { getSlotsAction, type SlotOption } from "../actions"

/*
 * Seletor de data + horário usado no novo agendamento e na remarcação:
 * busca os slots do serviço no dia (motor de horários) e agrupa por período.
 */
export function SlotPicker({
  serviceId,
  ignoreAppointmentId,
  initialYmd,
  value,
  onChange,
}: {
  serviceId: string
  ignoreAppointmentId?: string
  initialYmd: string
  value: string | null
  onChange: (iso: string | null) => void
}) {
  const [ymd, setYmd] = useState(initialYmd)
  const [slots, setSlots] = useState<SlotOption[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, startLoad] = useTransition()

  useEffect(() => {
    if (!serviceId || !ymd) return
    startLoad(async () => {
      const r = await getSlotsAction(serviceId, ymd, ignoreAppointmentId)
      setSlots(r.slots ?? [])
      setError(r.error ?? null)
    })
  }, [serviceId, ymd, ignoreAppointmentId])

  const groups = {
    Manhã: slots?.filter((s) => Number(s.label.slice(0, 2)) < 12) ?? [],
    Tarde:
      slots?.filter((s) => Number(s.label.slice(0, 2)) >= 12 && Number(s.label.slice(0, 2)) < 18) ??
      [],
    Noite: slots?.filter((s) => Number(s.label.slice(0, 2)) >= 18) ?? [],
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="slot-date">Data</Label>
        <Input
          id="slot-date"
          type="date"
          value={ymd}
          onChange={(e) => {
            setYmd(e.target.value)
            onChange(null)
          }}
          className="h-12"
        />
      </div>
      {!serviceId ? (
        <p className="type-body text-secondary-txt">Escolha o serviço para ver os horários.</p>
      ) : loading && !slots ? (
        <p className="type-body text-secondary-txt">Calculando horários…</p>
      ) : error ? (
        <p className="type-body text-error">{error}</p>
      ) : slots && slots.length === 0 ? (
        <p className="type-body text-secondary-txt">
          Nenhum horário livre nesse dia para esse serviço.
        </p>
      ) : (
        <div className={loading ? "flex flex-col gap-4 opacity-60" : "flex flex-col gap-4"}>
          {Object.entries(groups).map(([name, list]) =>
            list.length ? (
              <div key={name} className="flex flex-col gap-2">
                <p className="type-caption text-secondary-txt">{name}</p>
                <div className="flex flex-wrap gap-2">
                  {list.map((s) => (
                    <SlotButton
                      key={s.iso}
                      selected={value === s.iso}
                      onClick={() => onChange(s.iso)}
                      className="h-11 min-w-[88px]"
                    >
                      {s.label}
                    </SlotButton>
                  ))}
                </div>
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  )
}
