import type { ServiceRank } from "@/lib/finance"

/* "Serviços mais vendidos" (A1): nome, "28 atend." e barra magenta proporcional. */
export function TopServices({ items }: { items: ServiceRank[] }) {
  const max = Math.max(1, ...items.map((i) => i.count))
  if (items.length === 0) {
    return <p className="type-body text-secondary-txt">Sem atendimentos concluídos no período.</p>
  }
  return (
    <ul className="flex flex-col gap-4">
      {items.map((s) => (
        <li key={s.serviceId} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="type-body-medium truncate">{s.title}</span>
            <span className="type-body text-secondary-txt shrink-0">{s.count} atend.</span>
          </div>
          <div className="bg-elevated h-1 w-full overflow-hidden rounded-full">
            <div
              className="bg-gradient-primary h-full rounded-full"
              style={{ width: `${(s.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
