"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InfoBox } from "@/components/ui/info-box"
import { resetPasswordAction } from "../password-reset-actions"

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, {})
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="token" value={token} />
      {state.error ? (
        <InfoBox tone="error">
          {state.error}{" "}
          <Link href="/recuperar-senha" className="underline">
            Pedir novo link
          </Link>
        </InfoBox>
      ) : null}
      {(
        [
          ["password", "Nova senha"],
          ["confirm", "Confirmar nova senha"],
        ] as const
      ).map(([name, label]) => (
        <div key={name} className="flex flex-col gap-2">
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            name={name}
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            required
            aria-invalid={Boolean(state.fieldErrors?.[name])}
            aria-describedby={state.fieldErrors?.[name] ? `${name}-error` : undefined}
          />
          {state.fieldErrors?.[name]?.[0] ? (
            <p id={`${name}-error`} className="type-body text-error">
              {state.fieldErrors[name]?.[0]}
            </p>
          ) : null}
        </div>
      ))}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </form>
  )
}
