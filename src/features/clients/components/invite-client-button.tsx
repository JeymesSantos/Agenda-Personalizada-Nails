"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { inviteClientAction } from "../invitation-action"

export function InviteClientButton({ clientId }: { clientId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await inviteClientAction(clientId)
          if (result.error) return void toast.error(result.error)
          try {
            await navigator.clipboard.writeText(new URL(result.path!, window.location.origin).href)
            toast.success("Convite copiado. Envie à cliente; válido por 7 dias.")
          } catch {
            toast.error(
              "Não foi possível copiar. Permita acesso à área de transferência e tente novamente.",
            )
          }
        })
      }
    >
      {pending ? "Gerando convite…" : "Copiar convite para criar conta"}
    </Button>
  )
}
