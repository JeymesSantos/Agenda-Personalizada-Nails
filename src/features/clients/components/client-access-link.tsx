"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { createClientAccessLinkAction } from "../access-link-action"

export function ClientAccessLink({
  clientId,
  registered,
  hasWhatsapp,
}: {
  clientId: string
  registered: boolean
  hasWhatsapp: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [link, setLink] = useState<{ url: string; message: string; whatsappUrl: string } | null>(
    null,
  )
  return (
    <div className="flex flex-col gap-3">
      <p className="type-body text-secondary-txt">
        {registered
          ? "Gere um link de recuperação, válido por 1 hora."
          : "Envie um convite para a cliente criar sua conta mantendo os agendamentos e o histórico. Válido por 7 dias."}{" "}
        Confira o contato antes de enviar. O envio é manual pelo WhatsApp.
      </p>
      <Button
        variant="secondary"
        disabled={pending || !hasWhatsapp}
        onClick={() => {
          setLink(null)
          startTransition(async () => {
            try {
              const result = await createClientAccessLinkAction(clientId)
              if (result.error) return void toast.error(result.error)
              if (result.url && result.message && result.whatsappUrl)
                setLink({
                  url: result.url,
                  message: result.message,
                  whatsappUrl: result.whatsappUrl,
                })
            } catch {
              toast.error("Não foi possível gerar o link. Tente novamente.")
            }
          })
        }}
      >
        {pending
          ? "Gerando link…"
          : registered
            ? "Enviar link de recuperação"
            : "Enviar convite para criar conta"}
      </Button>
      {!hasWhatsapp ? (
        <p className="type-body text-secondary-txt">Cadastre o WhatsApp na seção Contato.</p>
      ) : null}
      {link ? (
        <div className="flex flex-col gap-3" aria-live="polite">
          <p className="type-body break-words whitespace-pre-line">{link.message}</p>
          <Button asChild>
            <a href={link.whatsappUrl} target="_blank" rel="noreferrer">
              Abrir WhatsApp para enviar
            </a>
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link.message)
                toast.success("Mensagem copiada para envio manual.")
              } catch {
                toast.error("Não foi possível copiar. Selecione e copie a mensagem acima.")
              }
            }}
          >
            Copiar mensagem com link
          </Button>
        </div>
      ) : null}
    </div>
  )
}
