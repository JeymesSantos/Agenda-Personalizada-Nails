import Link from "next/link"
import { RepeatIcon, SparklesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import type { AppointmentStatus } from "@/generated/prisma/enums"
import { fmt, fmtRange } from "@/lib/dates"
import { CancelButton } from "./cancel-button"

const MONTH_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
]
const WEEKDAY = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

/*
 * Card de "Meus horários" (M7): data em destaque, serviço, dia · horário, status,
 * e ações Remarcar / Serviço / Cancelar para os próximos.
 */
export function MyAppointmentCard({
  id,
  code,
  serviceTitle,
  startsAt,
  serviceEndsAt,
  status,
  timezone,
  token,
  editable,
  changeAllowed,
}: {
  id: string
  code: string
  serviceTitle: string
  startsAt: Date
  serviceEndsAt: Date
  status: AppointmentStatus
  timezone: string
  token: string | null
  editable: boolean
  changeAllowed: boolean
}) {
  const monthIndex = Number(fmt(startsAt, "M", timezone)) - 1
  const day = fmt(startsAt, "dd", timezone)
  const weekday = WEEKDAY[Number(fmt(startsAt, "i", timezone)) % 7]
  const q = token ? `?t=${token}` : ""

  return (
    <article className="bg-surface border-subtle flex flex-col gap-4 rounded-md border p-4">
      <div className="flex items-start gap-4">
        <div className="bg-surface-2 border-magenta-500/40 flex size-14 shrink-0 flex-col items-center justify-center rounded-sm border">
          <span className="type-caption text-pink-300">{MONTH_SHORT[monthIndex]}</span>
          <span className="type-h2 leading-7">{day}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Link href={`/agendamento/${code}${q}`} className="type-h3 truncate hover:underline">
            {serviceTitle}
          </Link>
          <p className="type-body text-secondary-txt">
            {weekday} · {fmtRange(startsAt, serviceEndsAt, timezone)}
          </p>
          <StatusBadge status={status} className="w-fit" />
        </div>
      </div>
      {editable ? (
        <div className="grid grid-cols-3 gap-2">
          <Button asChild variant="soft" size="sm" disabled={!changeAllowed}>
            <Link href={`/meus-horarios/${id}/remarcar${q}`}>
              <RepeatIcon /> Remarcar
            </Link>
          </Button>
          <Button asChild variant="soft" size="sm">
            <Link href={`/meus-horarios/${id}/remarcar${q}${q ? "&" : "?"}trocar=1`}>
              <SparklesIcon /> Serviço
            </Link>
          </Button>
          <CancelButton id={id} token={token} allowed={changeAllowed} />
        </div>
      ) : null}
    </article>
  )
}
