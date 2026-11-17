import { BellIcon } from "lucide-react"
import { fmtShortDate, fmtTime } from "@/lib/dates"

export type AppointmentNoticeItem = { id: string; message: string; createdAt: Date }

export function AppointmentNotices({
  items,
  timezone,
}: {
  items: AppointmentNoticeItem[]
  timezone: string
}) {
  if (!items.length) return null
  return (
    <section
      aria-label="Notificações do agendamento"
      className="border-subtle bg-surface-2 flex w-full flex-col gap-3 rounded-md border p-4 text-left"
    >
      <h3 className="type-body-medium flex items-center gap-2">
        <BellIcon className="size-4" /> Atualizações do agendamento
      </h3>
      <ul className="flex flex-col gap-3">
        {items.map((notice) => (
          <li key={notice.id} className="flex flex-col gap-1">
            <p className="type-body">{notice.message}</p>
            <time dateTime={notice.createdAt.toISOString()} className="type-caption text-muted-txt">
              {fmtShortDate(notice.createdAt, timezone)} · {fmtTime(notice.createdAt, timezone)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  )
}
