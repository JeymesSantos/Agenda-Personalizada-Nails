import { describe, expect, it } from "vitest"
import { workingDaySchema } from "./schemas"

const day = { weekday: 1, enabled: true, start: "09:00", end: "18:00" }
describe("intervalo de almoço", () => {
  it("aceita mudar a pausa ou trabalhar sem intervalo", () => {
    expect(
      workingDaySchema.safeParse({ ...day, breakStart: "12:15", breakEnd: "13:30" }).success,
    ).toBe(true)
    expect(workingDaySchema.safeParse({ ...day, breakStart: "", breakEnd: "" }).success).toBe(true)
  })
  it("recusa pausa incompleta, invertida, fora do expediente e horas inválidas", () => {
    for (const [breakStart, breakEnd] of [
      ["12:00", ""],
      ["13:00", "12:00"],
      ["08:00", "09:30"],
      ["12:60", "13:00"],
    ])
      expect(workingDaySchema.safeParse({ ...day, breakStart, breakEnd }).success).toBe(false)
  })
})
