"use client"

import { useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PlusIcon, SearchIcon, UserPlusIcon } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { fmtDuration } from "@/lib/dates"
import { formatPrice } from "@/lib/money"
import { createAppointmentAction, searchClientsAction } from "../actions"
import { SlotPicker } from "./slot-picker"

export type ServiceOption = {
  id: string
  title: string
  durationMin: number
  bufferMin: number
  priceCents: number
  visible: boolean
}

type ClientHit = { id: string; name: string; whatsapp: string | null; registered: boolean }

/* "+ Novo agendamento" (A2): cliente existente ou nova, serviço, data/horário, observação. */
export function NewAppointmentDialog({
  services,
  todayYmd,
  defaultOpen = false,
}: {
  services: ServiceOption[]
  todayYmd: string
  defaultOpen?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [open, setOpen] = useState(defaultOpen)
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing")
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<ClientHit[]>([])
  const [client, setClient] = useState<ClientHit | null>(null)
  const [serviceId, setServiceId] = useState(
    services.find((s) => s.visible)?.id ?? services[0]?.id ?? "",
  )
  const [startsAt, setStartsAt] = useState<string | null>(null)
  const [submitting, startSubmit] = useTransition()
  const [searching, startSearch] = useTransition()

  useEffect(() => {
    if (clientMode !== "existing" || query.trim().length < 2) return
    const t = setTimeout(() => {
      startSearch(async () => setHits(await searchClientsAction(query)))
    }, 250)
    return () => clearTimeout(t)
  }, [query, clientMode])

  const selectedService = services.find((s) => s.id === serviceId)
  const initialYmd = params.get("data") ?? todayYmd

  function submit(formData: FormData) {
    if (!startsAt) {
      toast.error("Escolha um horário.")
      return
    }
    formData.set("serviceId", serviceId)
    formData.set("startsAt", startsAt)
    if (clientMode === "existing") {
      if (!client) {
        toast.error("Escolha a cliente.")
        return
      }
      formData.set("clientId", client.id)
    }
    startSubmit(async () => {
      const r = await createAppointmentAction(formData)
      if (r.error) {
        toast.error(r.error)
        return
      }
      toast.success(r.success ?? "Agendamento criado.")
      setOpen(false)
      setStartsAt(null)
      setClient(null)
      setQuery("")
      const sp = new URLSearchParams(params.toString())
      sp.delete("novo")
      if (r.id) sp.set("agendamento", r.id)
      if (startsAt) sp.set("data", startsAt.slice(0, 10))
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon /> Novo agendamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>
            Encaixe manual: a agenda da cliente é atualizada na hora.
          </DialogDescription>
        </DialogHeader>
        <form action={submit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-3">
            <Label>Cliente</Label>
            <Tabs value={clientMode} onValueChange={(v) => setClientMode(v as "existing" | "new")}>
              <TabsList className="w-full">
                <TabsTrigger value="existing">
                  <SearchIcon /> Cliente cadastrada
                </TabsTrigger>
                <TabsTrigger value="new">
                  <UserPlusIcon /> Nova cliente
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {clientMode === "existing" ? (
              client ? (
                <div className="bg-surface-2 flex items-center justify-between rounded-md p-3">
                  <div>
                    <p className="type-body-medium">{client.name}</p>
                    <p className="type-body text-secondary-txt">
                      {client.whatsapp ?? "sem WhatsApp"} ·{" "}
                      {client.registered ? "com cadastro" : "sem cadastro"}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setClient(null)}>
                    Trocar
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="Buscar por nome ou WhatsApp"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    startIcon={<SearchIcon />}
                    className="h-12"
                    autoComplete="off"
                  />
                  {query.trim().length >= 2 ? (
                    <ul className="bg-surface-2 max-h-48 overflow-y-auto rounded-md">
                      {searching && hits.length === 0 ? (
                        <li className="type-body text-secondary-txt p-3">Buscando…</li>
                      ) : hits.length === 0 ? (
                        <li className="type-body text-secondary-txt p-3">
                          Nenhuma cliente encontrada.
                        </li>
                      ) : (
                        hits.map((h) => (
                          <li key={h.id}>
                            <button
                              type="button"
                              onClick={() => setClient(h)}
                              className="hover:bg-elevated flex w-full items-center justify-between p-3 text-left"
                            >
                              <span className="type-body-medium">{h.name}</span>
                              <span className="type-body text-secondary-txt">{h.whatsapp}</span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  ) : null}
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input name="clientName" placeholder="Nome" className="h-12" autoComplete="off" />
                <Input
                  name="clientWhatsapp"
                  placeholder="WhatsApp (11) 9 9999-9999"
                  inputMode="tel"
                  className="h-12"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="serviceId">Serviço</Label>
            <select
              id="serviceId"
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value)
                setStartsAt(null)
              }}
              className="type-body-l bg-surface-2 border-input text-foreground focus-visible:border-ring h-12 w-full rounded-md border px-4 outline-none"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} · {fmtDuration(s.durationMin)}
                  {s.bufferMin ? ` +${s.bufferMin}` : ""} · {formatPrice(s.priceCents)}
                  {!s.visible ? " (oculto)" : ""}
                </option>
              ))}
            </select>
            {selectedService ? (
              <p className="type-body text-secondary-txt">
                Bloqueia {fmtDuration(selectedService.durationMin + selectedService.bufferMin)} na
                agenda.
              </p>
            ) : null}
          </div>

          <SlotPicker
            serviceId={serviceId}
            initialYmd={initialYmd}
            value={startsAt}
            onChange={setStartsAt}
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor="note">Observação (opcional)</Label>
            <Textarea
              id="note"
              name="note"
              placeholder="Formato, cor, alergias…"
              className="min-h-20"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !startsAt}>
              {submitting ? "Agendando…" : "Confirmar agendamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
