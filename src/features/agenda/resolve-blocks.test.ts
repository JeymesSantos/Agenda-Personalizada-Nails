import { describe, expect, it } from "vitest"
import { resolveAgendaBlocks } from "./resolve-blocks"
import type { AgendaBlock } from "./queries"

const block = (
  id: string,
  kind: AgendaBlock["kind"],
  startMin: number,
  endMin: number,
): AgendaBlock => ({ id, kind, startMin, endMin, title: id, dayKey: "2026-11-16" })
describe("sobreposição de faixas na agenda", () => {
  it("o print: liberação às 13h recorta o almoço, preservando a parte anterior", () => {
    const result = resolveAgendaBlocks([
      block("lunch", "break", 750, 825),
      block("release", "release", 780, 1140),
    ])
    expect(result.map((b) => [b.kind, b.startMin, b.endMin])).toEqual([
      ["break", 750, 780],
      ["release", 780, 1140],
    ])
  })
  it("bloqueios prevalecem sobre liberações; agendamentos ocupam a própria faixa", () => {
    const result = resolveAgendaBlocks([
      block("release", "release", 780, 1140),
      block("blocked", "block", 800, 830),
      block("a", "appointment", 900, 975),
    ])
    const background = result
      .filter((b) => b.kind !== "appointment")
      .sort((a, b) => a.startMin - b.startMin)
    expect(background.map((b) => [b.kind, b.startMin, b.endMin])).toEqual([
      ["release", 780, 800],
      ["block", 800, 830],
      ["release", 830, 900],
      ["release", 975, 1140],
    ])
    for (let i = 1; i < background.length; i++)
      expect(background[i].startMin).toBeGreaterThanOrEqual(background[i - 1].endMin)
  })
})
