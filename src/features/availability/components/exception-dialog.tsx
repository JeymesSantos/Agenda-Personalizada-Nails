"use client"

import { useActionState, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CalendarIcon, CalendarDaysIcon, ClockIcon, LockIcon, UnlockIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { InfoBox } from "@/components/ui/info-box"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createExceptionAction, previewExceptionAction } from "../actions"
import type { AvailabilityFormState } from "../schemas"

type Mode = "month" | "days" | "range"

const modes: { value: Mode; label: string; icon: React.ReactNode }[] = [
  { value: "month", label: "Mês inteiro", icon: <CalendarIcon /> },
  { value: "days", label: "Dia(s)", icon: <CalendarDaysIcon /> },
  { value: "range", label: "Faixa de horário", icon: <ClockIcon /> },
]

/*
 * Modal "Bloquear ou liberar horários" (A4): abas Bloquear/Liberar, período
 * (mês inteiro, dia(s), faixa de horário), campos de data/hora, motivo
 * e aviso com a quantidade de agendamentos afetados.
 */
export function ExceptionDialog({
  defaultOpen = false,
  today,
  trigger,
}: {
  defaultOpen?: boolean
  /** "YYYY-MM-DD" local do estúdio */
  today: string
  trigger?: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [open, setOpen] = useState(defaultOpen)
  const [type, setType] = useState<"BLOCK" | "RELEASE">("BLOCK")
  const [mode, setMode] = useState<Mode>("range")
  const [state, formAction, pending] = useActionState(
    async (prev: AvailabilityFormState, formData: FormData) => {
      const result = await createExceptionAction(prev, formData)
      if (result.success) {
        toast.success(result.success)
        setOpen(false)
        if (params.get("bloquear")) {
          const sp = new URLSearchParams(params.toString())
          sp.delete("bloquear")
          router.replace(sp.size ? `${pathname}?${sp}` : pathname)
        }
      }
      if (result.error) toast.error(result.error)
      return result
    },
    {},
  )
  const [preview, setPreview] = useState<number | null>(null)
  const [previewing, startPreview] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const fe = state.fieldErrors ?? {}

  function refreshPreview() {
    const form = formRef.current
    if (!form) return
    const fd = new FormData(form)
    startPreview(async () => {
      const r = await previewExceptionAction(fd)
      setPreview(r.count ?? null)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Bloquear ou liberar horários</DialogTitle>
          <DialogDescription className="sr-only">
            Escolha o tipo, o período e um motivo. A agenda da cliente é atualizada na hora.
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          action={formAction}
          className="flex flex-col gap-5"
          onChange={refreshPreview}
          noValidate
        >
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="mode" value={mode} />

          <Tabs value={type} onValueChange={(v) => setType(v as "BLOCK" | "RELEASE")}>
            <TabsList className="w-full">
              <TabsTrigger value="BLOCK">
                <LockIcon /> Bloquear
              </TabsTrigger>
              <TabsTrigger value="RELEASE">
                <UnlockIcon /> Liberar
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-3">
            <Label>Período</Label>
            <div className="grid grid-cols-3 gap-3">
              {modes.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => {
                    setMode(m.value)
                    setPreview(null)
                  }}
                  data-active={mode === m.value || undefined}
                  className="bg-surface-2 border-subtle data-active:border-magenta-500 data-active:bg-magenta-500/10 flex h-20 flex-col items-start justify-between rounded-md border p-3 text-left transition-colors [&_svg]:size-5 [&_svg]:text-pink-300"
                >
                  {m.icon}
                  <span className="type-body-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {mode === "month" ? (
            <Field label="Mês" error={fe.month}>
              <Input type="month" name="month" defaultValue={today.slice(0, 7)} className="h-12" />
            </Field>
          ) : null}

          {mode === "days" ? (
            <div className="grid grid-cols-2 gap-4">
              <Field label="De" error={fe.startDate}>
                <Input type="date" name="startDate" defaultValue={today} className="h-12" />
              </Field>
              <Field label="Até (opcional)" error={fe.endDate}>
                <Input type="date" name="endDate" className="h-12" />
              </Field>
            </div>
          ) : null}

          {mode === "range" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-[1fr_120px_120px]">
              <Field label="Data" error={fe.startDate} className="col-span-2 sm:col-span-1">
                <Input type="date" name="startDate" defaultValue={today} className="h-12" />
              </Field>
              <Field label="De" error={fe.startTime}>
                <Input
                  type="time"
                  name="startTime"
                  defaultValue="15:00"
                  step={300}
                  className="h-12"
                />
              </Field>
              <Field label="Até" error={fe.endTime}>
                <Input
                  type="time"
                  name="endTime"
                  defaultValue="19:00"
                  step={300}
                  className="h-12"
                />
              </Field>
            </div>
          ) : null}

          <Field label="Motivo (só você vê)" error={fe.reason}>
            <Input
              name="reason"
              placeholder={type === "BLOCK" ? "Curso de nail art" : "Horário extra liberado"}
              className="h-12"
            />
          </Field>

          {type === "BLOCK" ? (
            preview != null && preview > 0 ? (
              <InfoBox tone="warning">
                {preview} agendamento{preview > 1 ? "s" : ""} nesse período. Eles continuam na
                agenda; remarque antes de bloquear, se precisar.
              </InfoBox>
            ) : (
              <InfoBox tone="info">
                {previewing ? "Verificando agendamentos…" : "Nenhum agendamento nesse período."} Os
                horários somem da agenda da cliente assim que você aplicar.
              </InfoBox>
            )
          ) : (
            <InfoBox tone="success">
              A liberação abre horários fora do expediente ou em dia fechado. Bloqueios existentes
              continuam valendo.
            </InfoBox>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Aplicando…" : type === "BLOCK" ? "Aplicar bloqueio" : "Liberar horário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string
  error?: string[]
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {error?.[0] ? <p className="type-body text-error">{error[0]}</p> : null}
    </div>
  )
}
