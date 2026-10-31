import type { MinuteInterval } from "./types"

/* Aritmética de intervalos semiabertos [start, end) em minutos. */

export function normalize(intervals: MinuteInterval[]): MinuteInterval[] {
  const sorted = intervals
    .filter((i) => i.end > i.start)
    .map((i) => ({ ...i }))
    .sort((a, b) => a.start - b.start)
  const out: MinuteInterval[] = []
  for (const i of sorted) {
    const last = out[out.length - 1]
    if (last && i.start <= last.end) {
      last.end = Math.max(last.end, i.end)
    } else {
      out.push(i)
    }
  }
  return out
}

export function subtract(base: MinuteInterval[], cuts: MinuteInterval[]): MinuteInterval[] {
  let result = normalize(base)
  for (const cut of normalize(cuts)) {
    const next: MinuteInterval[] = []
    for (const i of result) {
      if (cut.end <= i.start || cut.start >= i.end) {
        next.push(i)
        continue
      }
      if (cut.start > i.start) next.push({ start: i.start, end: cut.start })
      if (cut.end < i.end) next.push({ start: cut.end, end: i.end })
    }
    result = next
  }
  return result
}

export function union(a: MinuteInterval[], b: MinuteInterval[]): MinuteInterval[] {
  return normalize([...a, ...b])
}

/** Verdadeiro se [start, end) cabe inteiro dentro de algum intervalo. */
export function contains(intervals: MinuteInterval[], start: number, end: number): boolean {
  return intervals.some((i) => start >= i.start && end <= i.end)
}

export function clip(interval: MinuteInterval, min: number, max: number): MinuteInterval | null {
  const start = Math.max(interval.start, min)
  const end = Math.min(interval.end, max)
  return end > start ? { start, end } : null
}

export function totalMinutes(intervals: MinuteInterval[]): number {
  return normalize(intervals).reduce((sum, i) => sum + (i.end - i.start), 0)
}
