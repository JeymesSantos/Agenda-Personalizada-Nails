import Link from "next/link"
import { cn } from "cn"

import type { AgendaBlock, AgendaDay } from "../queries"

/* Visão mensal: 6 semanas, contagem de agendamentos por dia; clique abre o dia. */
export function MonthGrid({
  days,
  blocks,
  monthIndex,
}: {
  days: AgendaDay[]
  blocks: AgendaBlock[]
  monthIndex: number
}) {
  const counts = new Map<string, number>()
  const blocked = new Set<string>()
  for (const b of blocks) {
    if (b.kind === "appointment") counts.set(b.dayKey, (counts.get(b.dayKey) ?? 0) + 1)
    if (b.kind === "block" && b.endMin - b.startMin >= 8 * 60) blocked.add(b.dayKey)
  }

  return (
    <div className="bg-surface border-subtle overflow-hidden rounded-md border">
      <div className="border-subtle grid grid-cols-7 border-b">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
          .slice(0, days.length >= 42 ? 7 : 7)
          .map((w) => (
            <div key={w} className="type-caption text-muted-txt py-3 text-center">
              {w}
            </div>
          ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const inMonth =
            d.date.getMonth() === monthIndex || new Date(d.date).getMonth() === monthIndex
          const count = counts.get(d.key) ?? 0
          const off = d.closed || blocked.has(d.key)
          return (
            <Link
              key={d.key}
              href={`/admin/agenda?visao=dia&data=${d.key}`}
              className={cn(
                "border-subtle hover:bg-surface-2 flex min-h-[88px] flex-col gap-1.5 border-t border-l p-2 transition-colors first:border-l-0 [&:nth-child(7n+1)]:border-l-0",
                !inMonth && "opacity-40",
                off && "bg-base/40",
              )}
            >
              <span
                className={cn(
                  "type-body-medium flex size-7 items-center justify-center rounded-full",
                  d.isToday && "bg-magenta-500 text-pink-100",
                  off && !d.isToday && "text-muted-txt line-through",
                )}
              >
                {d.dayNumber}
              </span>
              {count > 0 ? (
                <span className="bg-magenta-500/18 type-caption w-fit rounded-full px-2 py-0.5 tracking-normal text-pink-300 normal-case">
                  {count} agend.
                </span>
              ) : null}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
