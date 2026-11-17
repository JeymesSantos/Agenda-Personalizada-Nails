import type { AgendaBlock } from "./queries"

/** Match availability precedence: appointments > blocks > releases > regular lunch. */
export function resolveAgendaBlocks(blocks: AgendaBlock[]): AgendaBlock[] {
  const priority = { appointment: 4, block: 3, release: 2, break: 1 }
  const result = blocks.filter((block) => block.kind === "appointment")
  for (const dayKey of new Set(blocks.map((block) => block.dayKey))) {
    const day = blocks.filter((block) => block.dayKey === dayKey)
    const points = [...new Set(day.flatMap((block) => [block.startMin, block.endMin]))].sort(
      (a, b) => a - b,
    )
    let previous: AgendaBlock | undefined
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i],
        end = points[i + 1]
      const source = day
        .filter((block) => block.startMin < end && block.endMin > start)
        .sort((a, b) => priority[b.kind] - priority[a.kind] || a.id.localeCompare(b.id))[0]
      if (!source || source.kind === "appointment") {
        previous = undefined
        continue
      }
      if (previous?.id.startsWith(`${source.id}::`) && previous.endMin === start) {
        previous.endMin = end
      } else {
        previous = { ...source, id: `${source.id}::${start}`, startMin: start, endMin: end }
        result.push(previous)
      }
    }
  }
  return result
}
