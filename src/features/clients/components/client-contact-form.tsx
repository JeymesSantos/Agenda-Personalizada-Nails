"use client"

import { useActionState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateClientContactAction, type ClientActionResult } from "../actions"

export function ClientContactForm({
  clientId,
  name,
  whatsapp,
}: {
  clientId: string
  name: string
  whatsapp: string | null
}) {
  const [, formAction, pending] = useActionState(async (prev: ClientActionResult, fd: FormData) => {
    const r = await updateClientContactAction(clientId, prev, fd)
    if (r.error) toast.error(r.error)
    if (r.success) toast.success(r.success)
    return r
  }, {})

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={name} className="h-12" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          defaultValue={whatsapp ?? ""}
          inputMode="tel"
          className="h-12"
        />
      </div>
      <Button type="submit" variant="soft" disabled={pending} className="h-12 w-full">
        {pending ? "Salvando…" : "Salvar contato"}
      </Button>
    </form>
  )
}
