"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "cn"

import { formatMinutes } from "@/lib/scheduling"
import type { AgendaBlock, AgendaDay } from "../queries"

const HOUR_PX = 56
const MIN_COL_PX = 84

/*
 * Grade da agenda (A2 semana / AM2 dia): coluna de horas, uma coluna por dia,
 * blocos posicionados pela hora. Agendamento em magenta (gradiente), faixa de
 * reorganização em âmbar abaixo, almoço e bloqueios em cinza tracejado,
 * liberações em verde tracejado. Clicar num agendamento seleciona (?agendamento=).
 */
export function AgendaGrid({
  days,
  blocks,
  gridStartMin,
  gridEndMin,
  selectedId,
  nowMin,
}: {
  days: AgendaDay[]
  blocks: AgendaBlock[]
  gridStartMin: number
  gridEndMin: number
  selectedId?: string
  /** minuto atual do dia local (para a linha "agora"), ou null */
  nowMin: number | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const hours: number[] = []
  for (let m = gridStartMin; m <= gridEndMin; m += 60) hours.push(m)
  const height = ((gridEndMin - gridStartMin) / 60) * HOUR_PX
  const top = (min: number) => ((Math.max(min, gridStartMin) - gridStartMin) / 60) * HOUR_PX
  const h = (a: number, b: number) =>
    ((Math.min(b, gridEndMin) - Math.max(a, gridStartMin)) / 60) * HOUR_PX

  const select = (id: string) => {
    const sp = new URLSearchParams(params.toString())
    sp.set("agendamento", id)
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
  }

  return (
    <div className="bg-surface border-subtle overflow-x-auto rounded-md border">
      <div
        className="grid pb-3"
        style={{
          gridTemplateColumns: `56px repeat(${days.length}, minmax(${days.length === 1 ? 240 : MIN_COL_PX}px, 1fr))`,
        }}
      >
        {/* cabeçalho */}
        <div className="border-subtle bg-surface sticky left-0 z-20 border-b" />
        {days.map((d) => (
          <div
            key={d.key}
            className={cn(
              "border-subtle type-body-medium flex h-14 items-center justify-center gap-1.5 border-b border-l",
              d.isToday ? "text-pink-300" : d.closed ? "text-muted-txt" : "text-foreground",
            )}
          >
            {d.weekdayShort} {d.dayNumber}
            {d.isToday ? <span className="bg-magenta-500 size-1.5 rounded-full" /> : null}
          </div>
        ))}

        {/* coluna de horas */}
        <div className="bg-surface sticky left-0 z-20" style={{ height }}>
          {hours.map((m) => (
            <div
              key={m}
              className="type-caption text-muted-txt absolute -translate-y-1/2 pr-3 text-right tracking-normal normal-case"
              style={{ top: top(m), left: 0, width: 56 }}
            >
              {formatMinutes(m)}
            </div>
          ))}
        </div>

        {/* colunas de dias */}
        {days.map((d) => {
          const dayBlocks = blocks.filter((b) => b.dayKey === d.key)
          return (
            <div
              key={d.key}
              className={cn("border-subtle relative border-l", d.closed && "bg-base/40")}
              style={{ height }}
            >
              {hours.map((m) => (
                <div
                  key={m}
                  className="border-subtle/60 absolute inset-x-0 border-t"
                  style={{ top: top(m) }}
                  aria-hidden
                />
              ))}
              {d.isToday && nowMin != null && nowMin >= gridStartMin && nowMin <= gridEndMin ? (
                <div
                  className="absolute inset-x-0 z-10 h-px bg-pink-300"
                  style={{ top: top(nowMin) }}
                  aria-hidden
                >
                  <span className="absolute -top-1 -left-1 size-2 rounded-full bg-pink-300" />
                </div>
              ) : null}

              {dayBlocks
                .filter((b) => b.kind !== "appointment")
                .map((b) => (
                  <div
                    key={b.id}
                    className={cn(
                      "absolute inset-x-1 rounded-sm border border-dashed px-2 py-1.5",
                      b.kind === "release"
                        ? "border-success/50 bg-success/8 text-success"
                        : "border-strong bg-elevated/60 text-muted-txt",
                    )}
                    style={{
                      top: top(b.startMin) + 1,
                      height: Math.max(h(b.startMin, b.endMin) - 2, 22),
                    }}
                  >
                    <p className="type-caption truncate">{b.title}</p>
                    {b.subtitle ? (
                      <p className="type-caption truncate opacity-80">{b.subtitle}</p>
                    ) : null}
                  </div>
                ))}

              {dayBlocks
                .filter((b) => b.kind === "appointment")
                .map((b) => {
                  const selected = b.id === selectedId
                  const serviceEnd = b.serviceEndMin ?? b.endMin
                  const serviceH = Math.max(h(b.startMin, serviceEnd) - 2, 26)
                  const bufferH = Math.max(h(serviceEnd, b.endMin) - 2, 0)
                  return (
                    <div
                      key={b.id}
                      className="absolute inset-x-1"
                      style={{ top: top(b.startMin) + 1 }}
                    >
                      <button
                        type="button"
                        onClick={() => select(b.id)}
                        aria-pressed={selected}
                        className={cn(
                          "w-full overflow-hidden rounded-sm border-l-2 px-2 py-1.5 text-left transition-all",
                          b.status === "DONE" &&
                            "bg-magenta-700/50 border-magenta-700 text-pink-100/90",
                          (b.status === "CONFIRMED" || b.status === "PENDING") &&
                            "bg-magenta-700/80 border-magenta-400 text-pink-100",
                          b.status === "NO_SHOW" && "bg-elevated border-strong text-muted-txt",
                          selected && "bg-gradient-primary glow-primary border-pink-300",
                        )}
                        style={{ height: serviceH }}
                      >
                        <p className="type-caption truncate">{b.title}</p>
                        <p className="type-caption truncate opacity-80">{b.subtitle}</p>
                      </button>
                      {bufferH > 0 ? (
                        <div
                          className="bg-warning/35 mt-0.5 w-full rounded-xs"
                          style={{ height: bufferH }}
                          title="Reorganização"
                          aria-hidden
                        />
                      ) : null}
                    </div>
                  )
                })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
