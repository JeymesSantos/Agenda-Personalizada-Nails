"use client"

import { useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { AppointmentStatus } from "@/generated/prisma/enums"
import { fmtDuration } from "@/lib/dates"
import {
  rescheduleAppointmentAction,
  setAppointmentStatusAction,
  updateAppointmentNoteAction,
  type ActionResult,
} from "../actions"
import type { ServiceOption } from "./new-appointment-dialog"
import { SlotPicker } from "./slot-picker"

/*
 * Ações do painel "Detalhe do agendamento" (A2), conforme o status:
 * PENDING  → Confirmar (primária), Remarcar, Falta, Cancelar
 * CONFIRMED → Marcar como concluído (primária), Remarcar, Falta, Cancelar
 * DONE / NO_SHOW / CANCELLED → Reabrir como confirmado
 */
export function AppointmentActions({
  id,
  status,
  serviceId,
  ymd,
  note,
  services,
}: {
  id: string
  status: AppointmentStatus
  serviceId: string
  ymd: string
  note: string | null
  services: ServiceOption[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [reschedule, setReschedule] = useState(false)
  const [newServiceId, setNewServiceId] = useState(serviceId)
  const [startsAt, setStartsAt] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState(note ?? "")

  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    startTransition(async () => {
      const r = await fn()
      if (r.error) {
        toast.error(r.error)
        return
      }
      if (r.success) toast.success(r.success)
      after?.()
    })

  const closePanel = () => {
    const sp = new URLSearchParams(params.toString())
    sp.delete("agendamento")
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
  }

  const active = status === "PENDING" || status === "CONFIRMED"

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder="Observação da cliente (formato, cor, alergias…)"
          className="min-h-20"
        />
        {noteDraft !== (note ?? "") ? (
          <Button
            type="button"
            variant="soft"
            size="sm"
            disabled={pending}
            onClick={() => run(() => updateAppointmentNoteAction(id, noteDraft))}
          >
            Salvar observação
          </Button>
        ) : null}
      </div>

      {active ? (
        <>
          {status === "PENDING" ? (
            <Button
              size="lg"
              disabled={pending}
              onClick={() => run(() => setAppointmentStatusAction(id, "CONFIRMED"))}
            >
              Confirmar agendamento
            </Button>
          ) : (
            <Button
              size="lg"
              disabled={pending}
              onClick={() => run(() => setAppointmentStatusAction(id, "DONE"))}
            >
              Marcar como concluído
            </Button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" disabled={pending} onClick={() => setReschedule(true)}>
              Remarcar
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => setAppointmentStatusAction(id, "NO_SHOW"))}
            >
              Falta
            </Button>
          </div>
          <Button
            variant="link"
            className="text-error mx-auto"
            disabled={pending}
            onClick={() => {
              if (!confirm("Cancelar este agendamento?")) return
              run(() => setAppointmentStatusAction(id, "CANCELLED"), closePanel)
            }}
          >
            Cancelar agendamento
          </Button>
        </>
      ) : (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => run(() => setAppointmentStatusAction(id, "CONFIRMED"))}
        >
          Reabrir como confirmado
        </Button>
      )}

      <Dialog open={reschedule} onOpenChange={setReschedule}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Remarcar</DialogTitle>
            <DialogDescription>
              Os horários são recalculados pela duração do serviço escolhido.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <select
              value={newServiceId}
              onChange={(e) => {
                setNewServiceId(e.target.value)
                setStartsAt(null)
              }}
              className="type-body-l bg-surface-2 border-input text-foreground h-12 w-full rounded-md border px-4 outline-none"
              aria-label="Serviço"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} · {fmtDuration(s.durationMin)}
                </option>
              ))}
            </select>
            <SlotPicker
              serviceId={newServiceId}
              ignoreAppointmentId={id}
              initialYmd={ymd}
              value={startsAt}
              onChange={setStartsAt}
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setReschedule(false)}>
              Voltar
            </Button>
            <Button
              disabled={pending || !startsAt}
              onClick={() =>
                run(
                  () => rescheduleAppointmentAction(id, newServiceId, startsAt!),
                  () => {
                    setReschedule(false)
                    const sp = new URLSearchParams(params.toString())
                    sp.set("data", startsAt!.slice(0, 10))
                    router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
                  },
                )
              }
            >
              Confirmar remarcação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
