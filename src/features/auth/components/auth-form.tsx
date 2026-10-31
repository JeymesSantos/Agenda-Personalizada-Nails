"use client"

import * as React from "react"
import { useActionState } from "react"
import { LockIcon, MailIcon, MessageCircleIcon, UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InfoBox } from "@/components/ui/info-box"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormState } from "../schemas"

type Action = (prev: FormState, formData: FormData) => Promise<FormState>

function Field({
  id,
  label,
  errors,
  children,
}: {
  id: string
  label: string
  errors?: string[]
  children: React.ReactNode
}) {
  const error = errors?.[0]
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="type-body text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function LoginForm({
  action,
  next,
  submitLabel = "Entrar",
}: {
  action: Action
  next?: string
  submitLabel?: string
}) {
  const [state, formAction, pending] = useActionState(action, {})
  const fe = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? <InfoBox tone="error">{state.error}</InfoBox> : null}
      <Field id="email" label="E-mail" errors={fe.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="seu@email.com"
          defaultValue={state.values?.email}
          aria-invalid={fe.email ? true : undefined}
          startIcon={<MailIcon />}
          required
        />
      </Field>
      <Field id="password" label="Senha" errors={fe.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          aria-invalid={fe.password ? true : undefined}
          startIcon={<LockIcon />}
          required
        />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="mt-2 w-full">
        {pending ? "Entrando…" : submitLabel}
      </Button>
    </form>
  )
}

export function RegisterForm({ action, next }: { action: Action; next?: string }) {
  const [state, formAction, pending] = useActionState(action, {})
  const fe = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? <InfoBox tone="error">{state.error}</InfoBox> : null}
      <Field id="name" label="Nome" errors={fe.name}>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          placeholder="Como podemos te chamar?"
          defaultValue={state.values?.name}
          aria-invalid={fe.name ? true : undefined}
          startIcon={<UserIcon />}
          required
        />
      </Field>
      <Field id="whatsapp" label="WhatsApp" errors={fe.whatsapp}>
        <Input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="(11) 9 9999-9999"
          defaultValue={state.values?.whatsapp}
          aria-invalid={fe.whatsapp ? true : undefined}
          startIcon={<MessageCircleIcon />}
          required
        />
      </Field>
      <Field id="email" label="E-mail" errors={fe.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="seu@email.com"
          defaultValue={state.values?.email}
          aria-invalid={fe.email ? true : undefined}
          startIcon={<MailIcon />}
          required
        />
      </Field>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="password" label="Senha" errors={fe.password}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            aria-invalid={fe.password ? true : undefined}
            startIcon={<LockIcon />}
            required
          />
        </Field>
        <Field id="confirm" label="Confirmar senha" errors={fe.confirm}>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Repita a senha"
            aria-invalid={fe.confirm ? true : undefined}
            startIcon={<LockIcon />}
            required
          />
        </Field>
      </div>
      <Button type="submit" size="lg" disabled={pending} className="mt-2 w-full">
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>
    </form>
  )
}
