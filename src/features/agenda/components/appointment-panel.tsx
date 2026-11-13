import {
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  MessageCircleIcon,
  SparklesIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/ui/status-badge"
import { SummaryRow } from "@/components/ui/summary-list"
import { fmtShortDate, fmtTime } from "@/lib/dates"
import { formatCents } from "@/lib/money"
import { appBaseUrl } from "@/lib/notifications"
import { ReminderList } from "@/features/reminders/components/reminder-list"
import { reminderText, whatsappLink } from "@/features/reminders/templates"
import type { getAppointmentDetail } from "../queries"
import { AppointmentActions } from "./appointment-actions"
import type { ServiceOption } from "./new-appointment-dialog"

type Detail = NonNullable<Awaited<ReturnType<typeof getAppointmentDetail>>>

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

function ordinal(n: number) {
  return `${n}ª visita`
}

function formatWhatsapp(w: string | null) {
  if (!w) return "—"
  const d = w.replace(/\D/g, "")
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return w
}

/* Painel "Detalhe do agendamento" (A2). */
export function AppointmentPanel({
  appointment,
  timezone,
  services,
  ymd,
  business,
}: {
  appointment: Detail
  timezone: string
  services: ServiceOption[]
  ymd: string
  business: { name: string; addressLine: string | null; neighborhood: string | null }
}) {
  const a = appointment
  const baseUrl = appBaseUrl()
  const reminders = a.reminders.map((r) => ({
    id: r.id,
    channel: r.channel,
    kind: r.kind,
    status: r.status,
    sendAt: r.sendAt,
    sentAt: r.sentAt,
    error: r.error,
    whatsappUrl:
      r.channel === "WHATSAPP" && a.client.whatsapp
        ? whatsappLink(
            a.client.whatsapp,
            reminderText({
              kind: r.kind,
              clientName: a.client.name,
              businessName: business.name,
              serviceTitle: a.service.title,
              startsAt: a.startsAt,
              timezone,
              code: a.code,
              manageToken: a.manageToken,
              baseUrl,
              addressLine: business.addressLine,
              neighborhood: business.neighborhood,
            }),
          )
        : null,
  }))
  return (
    <div className="flex flex-col gap-5">
      <h2 className="type-h3">Detalhe do agendamento</h2>
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarFallback className="bg-surface-2 type-body-medium text-pink-300">
            {initials(a.client.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="type-h3">{a.client.name}</span>
          <span className="type-body text-secondary-txt">
            {a.client.passwordHash ? "Cliente com cadastro" : "Cliente sem cadastro"} ·{" "}
            {ordinal(a.visits)}
          </span>
        </div>
      </div>
      <StatusBadge status={a.status} className="w-fit" />

      <dl className="flex flex-col gap-3.5">
        <SummaryRow icon={<SparklesIcon />} label="Serviço">
          {a.service.title}
        </SummaryRow>
        <SummaryRow icon={<CalendarIcon />} label="Data">
          {fmtShortDate(a.startsAt, timezone)}
        </SummaryRow>
        <SummaryRow icon={<ClockIcon />} label="Horário">
          {fmtTime(a.startsAt, timezone)} – {fmtTime(a.serviceEndsAt, timezone)}
          {a.service.bufferMin ? ` (+${a.service.bufferMin})` : ""}
        </SummaryRow>
        <SummaryRow icon={<CreditCardIcon />} label="Valor">
          {formatCents(a.priceCents)}
        </SummaryRow>
        <SummaryRow icon={<MessageCircleIcon />} label="WhatsApp">
          {a.client.whatsapp ? (
            <a
              href={`https://wa.me/55${a.client.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {formatWhatsapp(a.client.whatsapp)}
            </a>
          ) : (
            "—"
          )}
        </SummaryRow>
      </dl>

      <div className="bg-surface-2 rounded-md p-4">
        <p className="type-caption text-secondary-txt mb-2">Observação da cliente</p>
        <AppointmentActions
          id={a.id}
          status={a.status}
          serviceId={a.serviceId}
          ymd={ymd}
          note={a.note}
          services={services}
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="type-caption text-secondary-txt">Lembretes</p>
        <ReminderList reminders={reminders} timezone={timezone} />
      </div>
      <p className="type-body text-muted-txt text-center">Comprovante #{a.code}</p>
    </div>
  )
}
