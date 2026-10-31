"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { MessageCircleIcon, UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InfoBox } from "@/components/ui/info-box"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { createPublicBookingAction } from "../actions"

const STORAGE_KEY = "minhaagenda:cliente"

type Saved = { name: string; whatsapp: string }

function readSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Saved) : null
  } catch {
    return null
  }
}

/*
 * Passo 3 (M5): abas "Sem cadastro" / "Entrar / criar conta", nome, WhatsApp,
 * observações, "Salvar meus dados" (localStorage, preenchido via ref para não
 * divergir do HTML do servidor) e botão Confirmar. Logada: só WhatsApp (se faltar) e observações.
 */
export function GuestBookingForm({
  serviceId,
  startsAtIso,
  loginHref,
  signupHref,
  member,
  summary,
  footerText,
}: {
  serviceId: string
  startsAtIso: string
  loginHref: string
  signupHref: string
  member: { name: string; whatsapp: string | null } | null
  summary: React.ReactNode
  footerText: string
}) {
  const [state, formAction, pending] = useActionState(createPublicBookingAction, {})
  const [mode, setMode] = useState<"guest" | "account">("guest")
  const [remember, setRemember] = useState(true)
  const nameRef = useRef<HTMLInputElement>(null)
  const whatsappRef = useRef<HTMLInputElement>(null)
  const fe = state.fieldErrors ?? {}

  useEffect(() => {
    if (member) return
    const saved = readSaved()
    if (!saved) return
    if (nameRef.current && !nameRef.current.value) nameRef.current.value = saved.name
    if (whatsappRef.current && !whatsappRef.current.value)
      whatsappRef.current.value = saved.whatsapp
  }, [member, mode])

  function persist(form: HTMLFormElement) {
    try {
      const name = String(new FormData(form).get("name") ?? "")
      const whatsapp = String(new FormData(form).get("whatsapp") ?? "")
      if (remember && name && whatsapp)
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, whatsapp }))
      else if (!remember) localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* armazenamento indisponível: segue sem lembrar */
    }
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => persist(e.currentTarget)}
      className="flex flex-col gap-5"
      noValidate
    >
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="startsAt" value={startsAtIso} />

      {member ? (
        <div className="bg-surface border-subtle flex items-center gap-3 rounded-md border p-4">
          <span className="bg-magenta-500/18 flex size-10 items-center justify-center rounded-full text-pink-300">
            <UserIcon className="size-5" />
          </span>
          <span className="flex flex-col">
            <span className="type-body-medium">Agendando como {member.name}</span>
            <span className="type-body text-secondary-txt">
              Seus horários ficam salvos na sua conta.
            </span>
          </span>
        </div>
      ) : (
        <Tabs value={mode} onValueChange={(v) => setMode(v as "guest" | "account")}>
          <TabsList className="w-full">
            <TabsTrigger value="guest">Sem cadastro</TabsTrigger>
            <TabsTrigger value="account">Entrar / criar conta</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {!member && mode === "account" ? (
        <div className="bg-surface border-subtle flex flex-col gap-4 rounded-md border p-5">
          <p className="type-body text-secondary-txt">
            Com conta, seus horários ficam salvos e você remarca com um toque. Voltamos para esta
            tela depois.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild>
              <Link href={loginHref}>Entrar</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={signupHref}>Criar conta</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {state.error ? <InfoBox tone="error">{state.error}</InfoBox> : null}
          {!member ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                ref={nameRef}
                id="name"
                name="name"
                defaultValue={state.values?.name}
                placeholder="Como podemos te chamar?"
                autoComplete="name"
                startIcon={<UserIcon />}
                aria-invalid={fe.name ? true : undefined}
                required
              />
              {fe.name?.[0] ? <p className="type-body text-error">{fe.name[0]}</p> : null}
            </div>
          ) : null}
          {!member || !member.whatsapp ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                ref={whatsappRef}
                id="whatsapp"
                name="whatsapp"
                defaultValue={state.values?.whatsapp}
                placeholder="(11) 9 9999-9999"
                inputMode="tel"
                autoComplete="tel"
                startIcon={<MessageCircleIcon />}
                aria-invalid={fe.whatsapp ? true : undefined}
                required
              />
              {fe.whatsapp?.[0] ? <p className="type-body text-error">{fe.whatsapp[0]}</p> : null}
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="note">Observações (opcional)</Label>
            <Textarea
              id="note"
              name="note"
              defaultValue={state.values?.note}
              placeholder="Formato, cor, alergias…"
              className="min-h-20"
            />
          </div>
          {!member ? (
            <label className="flex items-center justify-between gap-4">
              <span className="type-body-medium">Salvar meus dados para remarcar com 1 toque</span>
              <Switch checked={remember} onCheckedChange={setRemember} />
            </label>
          ) : null}

          {summary}

          <p className="type-body text-secondary-txt">{footerText}</p>
          <Button type="submit" size="lg" disabled={pending} className="w-full">
            {pending ? "Confirmando…" : "Confirmar agendamento"}
          </Button>
        </>
      )}
    </form>
  )
}
