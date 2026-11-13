"use client"

import { useTransition } from "react"
import { CheckIcon, MailIcon, MessageCircleIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ReminderChannel, ReminderKind, ReminderStatus } from "@/generated/prisma/enums"
import { fmtShortDate, fmtTime } from "@/lib/dates"

import { markReminderSentAction } from "../actions"
import { REMINDER_KIND_LABELS } from "../templates"

export type ReminderRow = {
  id: string
  channel: ReminderChannel
  kind: ReminderKind
  status: ReminderStatus
  sendAt: Date
  sentAt: Date | null
  error: string | null
  /* link wa.me com o texto pronto (só WhatsApp) */
  whatsappUrl: string | null
}

const STATUS: Record<
  ReminderStatus,
  { label: string; variant: "neutral" | "success" | "error" | "warning" }
> = {
  SCHEDULED: { label: "Agendado", variant: "neutral" },
  SENT: { label: "Enviado", variant: "success" },
  FAILED: { label: "Falhou", variant: "error" },
  CANCELLED: { label: "Cancelado", variant: "warning" },
}

/*
 * Lembretes do agendamento no painel de detalhe (A2). E-mail sai sozinho
 * pelo cron; WhatsApp a profissional manda pelo link e marca como enviado.
 */
export function ReminderList({
  reminders,
  timezone,
}: {
  reminders: ReminderRow[]
  timezone: string
}) {
  const [pending, startTransition] = useTransition()
  if (reminders.length === 0) {
    return (
      <p className="type-body text-secondary-txt">
        Sem lembretes: a cliente não tem e-mail nem WhatsApp cadastrados.
      </p>
    )
  }
  const mark = (id: string) =>
    startTransition(async () => {
      const r = await markReminderSentAction(id)
      if (r.error) toast.error(r.error)
      else toast.success(r.success)
    })

  return (
    <ul className="flex flex-col gap-2">
      {reminders.map((r) => {
        const st = STATUS[r.status]
        const manual = r.channel === "WHATSAPP" && r.status === "SCHEDULED" && r.whatsappUrl
        const when = r.status === "SENT" && r.sentAt ? r.sentAt : r.sendAt
        return (
          <li
            key={r.id}
            className="bg-surface-2 flex flex-col gap-2 rounded-sm px-3 py-2"
            title={r.error ?? undefined}
          >
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-pink-300 [&_svg]:size-4">
                {r.channel === "EMAIL" ? (
                  <MailIcon aria-label="E-mail" />
                ) : (
                  <MessageCircleIcon aria-label="WhatsApp" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="type-body-medium truncate">{REMINDER_KIND_LABELS[r.kind]}</p>
                <p className="type-caption text-secondary-txt">
                  {r.status === "SENT" ? "Enviado " : "Sai "}
                  {fmtShortDate(when, timezone)} {fmtTime(when, timezone)}
                </p>
              </div>
              <Badge variant={st.variant} dot className="shrink-0">
                {st.label}
              </Badge>
            </div>
            {manual ? (
              <div className="flex flex-wrap gap-2 pl-6">
                <Button asChild variant="secondary" size="xs">
                  <a href={r.whatsappUrl!} target="_blank" rel="noreferrer">
                    <MessageCircleIcon /> Enviar no WhatsApp
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="soft"
                  size="xs"
                  onClick={() => mark(r.id)}
                  disabled={pending}
                >
                  <CheckIcon /> Marcar enviado
                </Button>
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
