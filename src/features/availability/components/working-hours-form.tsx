"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { saveWorkingHoursAction } from "../actions"
import { WEEKDAYS, minutesToTime } from "../schemas"

export type WorkingDayRow = {
  weekday: number
  enabled: boolean
  startMin: number
  endMin: number
  breakStartMin: number | null
  breakEndMin: number | null
}

/*
 * "Horário de funcionamento" (A4): uma linha por dia com toggle, início–fim e pausa.
 * Ordem segunda → domingo, como no Figma.
 */
export function WorkingHoursForm({ days }: { days: WorkingDayRow[] }) {
  const [state, formAction, pending] = useActionState(saveWorkingHoursAction, {})
  const [enabled, setEnabled] = useState<Record<number, boolean>>(
    Object.fromEntries(days.map((d) => [d.weekday, d.enabled])),
  )
  const [pause, setPause] = useState<Record<number, boolean>>(
    Object.fromEntries(
      days.map((d) => [d.weekday, d.breakStartMin != null && d.breakEndMin != null]),
    ),
  )
  const fe = state.fieldErrors ?? {}
  const ordered = [1, 2, 3, 4, 5, 6, 0].map((w) => days.find((d) => d.weekday === w)!)

  useEffect(() => {
    if (state.success) toast.success(state.success)
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {ordered.map((d) => {
        const on = enabled[d.weekday]
        const err =
          fe[`d${d.weekday}.start`] ??
          fe[`d${d.weekday}.end`] ??
          fe[`d${d.weekday}.breakEnd`] ??
          fe[`d${d.weekday}.breakStart`]
        return (
          <div
            key={d.weekday}
            className="bg-surface-2/60 flex flex-col gap-3 rounded-sm p-3"
            data-enabled={on}
          >
            <label className="flex min-w-[140px] items-center gap-3">
              <Switch
                name={`d${d.weekday}.enabled`}
                checked={on}
                onCheckedChange={(c) => setEnabled((e) => ({ ...e, [d.weekday]: c }))}
              />
              <span className="type-body-medium" style={{ opacity: on ? 1 : 0.6 }}>
                {WEEKDAYS[d.weekday]}
              </span>
            </label>
            <div
              className="flex flex-1 flex-wrap items-center gap-2"
              style={{ opacity: on ? 1 : 0.4 }}
            >
              <TimeField
                name={`d${d.weekday}.start`}
                defaultValue={minutesToTime(d.startMin)}
                disabled={!on}
                label={`${WEEKDAYS[d.weekday]}: início do expediente`}
              />
              <span className="type-body text-muted-txt">–</span>
              <TimeField
                name={`d${d.weekday}.end`}
                defaultValue={minutesToTime(d.endMin)}
                disabled={!on}
                label={`${WEEKDAYS[d.weekday]}: fim do expediente`}
              />
            </div>
            <label className="type-body flex items-center gap-3">
              <Switch
                checked={pause[d.weekday]}
                disabled={!on}
                onCheckedChange={(checked) =>
                  setPause((previous) => ({ ...previous, [d.weekday]: checked }))
                }
              />
              Intervalo de almoço / pausa
            </label>
            {pause[d.weekday] ? (
              <div className="flex flex-wrap items-center gap-2">
                <TimeField
                  name={`d${d.weekday}.breakStart`}
                  defaultValue={d.breakStartMin != null ? minutesToTime(d.breakStartMin) : "12:00"}
                  disabled={!on}
                  label={`${WEEKDAYS[d.weekday]}: início do almoço`}
                />
                <span className="type-body text-muted-txt">–</span>
                <TimeField
                  name={`d${d.weekday}.breakEnd`}
                  defaultValue={d.breakEndMin != null ? minutesToTime(d.breakEndMin) : "13:00"}
                  disabled={!on}
                  label={`${WEEKDAYS[d.weekday]}: fim do almoço`}
                />
              </div>
            ) : (
              <p className="type-caption text-secondary-txt">Sem intervalo neste dia.</p>
            )}
            {!on ? (
              <>
                <input
                  type="hidden"
                  name={`d${d.weekday}.start`}
                  value={minutesToTime(d.startMin)}
                />
                <input type="hidden" name={`d${d.weekday}.end`} value={minutesToTime(d.endMin)} />
                {pause[d.weekday] ? (
                  <>
                    <input
                      type="hidden"
                      name={`d${d.weekday}.breakStart`}
                      value={d.breakStartMin != null ? minutesToTime(d.breakStartMin) : "12:00"}
                    />
                    <input
                      type="hidden"
                      name={`d${d.weekday}.breakEnd`}
                      value={d.breakEndMin != null ? minutesToTime(d.breakEndMin) : "13:00"}
                    />
                  </>
                ) : null}
              </>
            ) : null}
            {err ? <p className="type-body text-error sm:basis-full">{err[0]}</p> : null}
          </div>
        )
      })}
      <div className="mt-3 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar horários"}
        </Button>
      </div>
    </form>
  )
}

function TimeField({
  name,
  defaultValue,
  disabled,
  label,
}: {
  name: string
  defaultValue: string
  disabled: boolean
  label: string
}) {
  return (
    <Input
      type="time"
      name={name}
      defaultValue={defaultValue}
      disabled={disabled}
      aria-label={label}
      step={300}
      className="h-11 w-[108px] px-3 text-[15px]"
    />
  )
}
