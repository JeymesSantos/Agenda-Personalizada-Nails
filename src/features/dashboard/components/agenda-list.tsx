import Link from "next/link"
import { cn } from "cn"

import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import type { AgendaItem } from "@/features/dashboard/queries"
import { fmtDuration, fmtTime } from "@/lib/dates"
import { formatCents } from "@/lib/money"

const statusBar: Record<AgendaItem["status"], string> = {
  DONE: "bg-info",
  CONFIRMED: "bg-success",
  PENDING: "bg-warning",
  CANCELLED: "bg-error",
  NO_SHOW: "bg-muted-txt",
}

/*
 * "Agenda de hoje" (A1 / AM1): hora e duração à esquerda, barra colorida pelo status,
 * nome da cliente (com "(sem cadastro)" quando for o caso), serviço · valor, badge.
 */
export function AgendaList({
  items,
  timezone,
  compact = false,
}: {
  items: AgendaItem[]
  timezone: string
  compact?: boolean
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhum atendimento hoje"
        description="Dia livre. Que tal bloquear um horário para descanso ou abrir encaixes?"
        className="py-8"
      />
    )
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((a) => (
        <li key={a.id}>
          <Link
            href={`/admin/agenda?data=${a.startsAt.toISOString().slice(0, 10)}&agendamento=${a.id}`}
            className="bg-surface-2 hover:bg-elevated flex items-center gap-4 rounded-sm p-4 transition-colors"
          >
            <div className="flex w-14 shrink-0 flex-col">
              <span className="type-h3">{fmtTime(a.startsAt, timezone)}</span>
              <span className="type-body text-muted-txt">{fmtDuration(a.durationMin)}</span>
            </div>
            <span
              aria-hidden
              className={cn("h-10 w-0.5 shrink-0 rounded-full", statusBar[a.status])}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="type-body-medium truncate">
                {a.clientName}
                {!a.clientRegistered ? (
                  <span className="text-secondary-txt"> (sem cadastro)</span>
                ) : null}
              </span>
              <span className="type-body text-secondary-txt truncate">
                {a.serviceTitle}
                {!compact ? ` · ${formatCents(a.priceCents)}` : null}
              </span>
            </div>
            <StatusBadge status={a.status} className="shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
