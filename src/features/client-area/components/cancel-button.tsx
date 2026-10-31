"use client"

import { useState, useTransition } from "react"
import { XIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cancelMyAppointmentAction } from "../actions"

/* "Cancelar" (M7/M8): abre uma sheet de confirmação e chama a action. */
export function CancelButton({
  id,
  token,
  allowed,
}: {
  id: string
  token: string | null
  allowed: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <XIcon /> Cancelar
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Cancelar agendamento</SheetTitle>
            <SheetDescription>
              {allowed
                ? "O horário volta a ficar livre para outras clientes. Você pode agendar de novo quando quiser."
                : "O prazo de cancelamento gratuito já passou. Fale com a profissional no WhatsApp."}
            </SheetDescription>
          </SheetHeader>
          <SheetBody />
          <SheetFooter className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="danger"
              disabled={pending || !allowed}
              onClick={() =>
                startTransition(async () => {
                  const r = await cancelMyAppointmentAction(id, token)
                  if (r.error) {
                    toast.error(r.error)
                    return
                  }
                  toast.success(r.success)
                  setOpen(false)
                })
              }
            >
              {pending ? "Cancelando…" : "Confirmar cancelamento"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
