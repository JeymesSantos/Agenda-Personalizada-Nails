import { TZDate } from "@date-fns/tz"
import { describe, expect, it } from "vitest"

import { contains, normalize, subtract, union } from "./intervals"
import {
  formatMinutes,
  getAvailableSlots,
  getDayAvailability,
  getFreeIntervals,
  getMonthAvailability,
  getOpenIntervals,
  groupSlotsByPeriod,
  hasConflict,
  isBookable,
} from "./slots"
import type { AvailabilityInput, WorkingHoursRule } from "./types"

const TZ = "America/Sao_Paulo"
const h = (hours: number, minutes = 0) => hours * 60 + minutes

/* Seg–sáb 09:00–19:00 com almoço 12:30–13:45; domingo fechado. */
const workingHours: WorkingHoursRule[] = Array.from({ length: 7 }, (_, weekday) => ({
  weekday,
  enabled: weekday !== 0,
  startMin: h(9),
  endMin: h(19),
  breakStartMin: h(12, 30),
  breakEndMin: h(13, 45),
}))

/* Quinta, 5 de novembro de 2026 (dia das telas do Figma). */
const day = new TZDate(2026, 10, 5, 0, 0, 0, TZ)
const at = (hours: number, minutes = 0, d = 5) => new TZDate(2026, 10, d, hours, minutes, 0, TZ)

const alongamento = { durationMin: 120, bufferMin: 15 }
const manutencao = { durationMin: 60, bufferMin: 15 }

function input(overrides: Partial<AvailabilityInput> = {}): AvailabilityInput {
  return {
    timezone: TZ,
    workingHours,
    exceptions: [],
    appointments: [],
    service: alongamento,
    stepMin: 15,
    now: new TZDate(2026, 10, 1, 8, 0, 0, TZ),
    ...overrides,
  }
}

const starts = (slots: { startMin: number }[]) => slots.map((s) => formatMinutes(s.startMin))

describe("intervalos", () => {
  it("normaliza, une e subtrai", () => {
    expect(
      normalize([
        { start: 10, end: 20 },
        { start: 15, end: 30 },
        { start: 40, end: 50 },
      ]),
    ).toEqual([
      { start: 10, end: 30 },
      { start: 40, end: 50 },
    ])
    expect(union([{ start: 0, end: 10 }], [{ start: 10, end: 20 }])).toEqual([
      { start: 0, end: 20 },
    ])
    expect(
      subtract(
        [{ start: 0, end: 100 }],
        [
          { start: 20, end: 30 },
          { start: 90, end: 200 },
        ],
      ),
    ).toEqual([
      { start: 0, end: 20 },
      { start: 30, end: 90 },
    ])
    expect(contains([{ start: 0, end: 60 }], 0, 60)).toBe(true)
    expect(contains([{ start: 0, end: 60 }], 30, 61)).toBe(false)
  })
})

describe("intervalos abertos do dia", () => {
  it("aplica o horário de funcionamento com a pausa de almoço", () => {
    expect(getOpenIntervals(day, input())).toEqual([
      { start: h(9), end: h(12, 30) },
      { start: h(13, 45), end: h(19) },
    ])
  })

  it("domingo fechado", () => {
    const sunday = new TZDate(2026, 10, 1, 0, 0, 0, TZ)
    expect(getOpenIntervals(sunday, input())).toEqual([])
    expect(getDayAvailability(sunday, input())).toBe("closed")
  })

  it("bloqueio por faixa de horário remove a tarde (curso de nail art)", () => {
    const exceptions = [{ type: "BLOCK" as const, startsAt: at(15), endsAt: at(19) }]
    expect(getOpenIntervals(day, input({ exceptions }))).toEqual([
      { start: h(9), end: h(12, 30) },
      { start: h(13, 45), end: h(15) },
    ])
  })

  it("bloqueio de dia inteiro fecha o dia, mesmo quando o período começa no dia anterior", () => {
    const exceptions = [{ type: "BLOCK" as const, startsAt: at(0, 0, 4), endsAt: at(0, 0, 6) }]
    expect(getOpenIntervals(day, input({ exceptions }))).toEqual([])
    expect(getDayAvailability(day, input({ exceptions }))).toBe("closed")
  })

  it("liberação abre horário em dia fechado (domingo) e fora do expediente", () => {
    const sunday = new TZDate(2026, 10, 1, 0, 0, 0, TZ)
    const exceptions = [{ type: "RELEASE" as const, startsAt: at(15, 0, 1), endsAt: at(18, 0, 1) }]
    expect(getOpenIntervals(sunday, input({ exceptions }))).toEqual([{ start: h(15), end: h(18) }])
    const late = [{ type: "RELEASE" as const, startsAt: at(19), endsAt: at(21) }]
    expect(getOpenIntervals(day, input({ exceptions: late }))).toEqual([
      { start: h(9), end: h(12, 30) },
      { start: h(13, 45), end: h(21) },
    ])
  })

  it("bloqueio vence liberação no mesmo período", () => {
    const exceptions = [
      { type: "RELEASE" as const, startsAt: at(19), endsAt: at(21) },
      { type: "BLOCK" as const, startsAt: at(20), endsAt: at(21) },
    ]
    expect(getOpenIntervals(day, input({ exceptions })).at(-1)).toEqual({
      start: h(13, 45),
      end: h(20),
    })
  })
})

describe("slots disponíveis", () => {
  it("dia vazio: alongamento (2h + 15) cabe até 16:30, nunca às 17:00", () => {
    const slots = getAvailableSlots(day, input())
    const s = starts(slots)
    expect(s[0]).toBe("09:00")
    expect(s).toContain("10:15")
    expect(s).toContain("16:30")
    expect(s).not.toContain("17:00")
    expect(s.at(-1)).toBe("16:45") // 16:45 + 2h15 = 19:00, cabe exato
    /* manhã: último início que termina (com reorganização) até 12:30 é 10:15 */
    expect(s).toContain("10:15")
    expect(s).not.toContain("10:30")
    expect(slots[0].serviceEndsAt).toEqual(at(11, 0))
    expect(slots[0].endsAt).toEqual(at(11, 15))
  })

  it("serviço que não cabe antes da pausa só volta depois do almoço", () => {
    const slots = starts(getAvailableSlots(day, input({ service: manutencao })))
    /* manutenção 1h + 15: último da manhã é 11:15 (termina 12:30) */
    expect(slots).toContain("11:15")
    expect(slots).not.toContain("11:30")
    expect(slots).toContain("13:45")
    expect(slots).not.toContain("13:30")
  })

  it("reorganização do agendamento anterior empurra o próximo início", () => {
    const appointments = [{ startsAt: at(9), endsAt: at(11, 15) }] // alongamento 09:00 + 2h + 15
    const slots = starts(getAvailableSlots(day, input({ appointments, service: manutencao })))
    expect(slots).not.toContain("09:00")
    expect(slots).not.toContain("11:00")
    expect(slots[0]).toBe("11:15")
  })

  it("colisão parcial: agendamento no meio do intervalo bloqueia os inícios ao redor", () => {
    const appointments = [{ startsAt: at(14, 15), endsAt: at(16, 30) }]
    const slots = starts(getAvailableSlots(day, input({ appointments, service: manutencao })))
    expect(slots).not.toContain("13:00")
    expect(slots).not.toContain("13:45") // 13:45 + 1h15 = 15:00 cruza 14:15
    expect(slots).not.toContain("15:00")
    expect(slots).toContain("16:30")
    expect(slots).toContain("17:45")
    expect(slots).not.toContain("18:00") // 18:00 + 1h15 = 19:15 > 19:00
  })

  it("horários no passado e antecedência mínima são descartados", () => {
    const now = at(14, 20)
    const slots = starts(getAvailableSlots(day, input({ now, service: manutencao })))
    expect(slots[0]).toBe("14:30")
    const withNotice = starts(
      getAvailableSlots(day, input({ now, minNoticeMin: 60, service: manutencao })),
    )
    expect(withNotice[0]).toBe("15:30")
  })

  it("passo diferente (30 min) alinha os inícios à meia-noite", () => {
    const slots = starts(getAvailableSlots(day, input({ stepMin: 30, service: manutencao })))
    expect(slots.slice(0, 4)).toEqual(["09:00", "09:30", "10:00", "10:30"])
    expect(slots).not.toContain("09:15")
  })

  it("agrupa em manhã e tarde", () => {
    const groups = groupSlotsByPeriod(getAvailableSlots(day, input({ service: manutencao })))
    expect(groups.manha.every((s) => s.startMin < h(12))).toBe(true)
    expect(groups.tarde[0].startMin).toBe(h(13, 45))
    expect(groups.noite).toEqual([])
  })

  it("respeita o fuso: instante UTC do início corresponde a 09:00 em São Paulo", () => {
    const [first] = getAvailableSlots(day, input())
    expect(first.startsAt.toISOString()).toBe("2026-11-05T12:00:00.000Z")
  })
})

describe("cenário do Figma: como os horários livres são calculados", () => {
  /*
   * 09:00 Alongamento em gel (2h) + 15 → 11:15 Manutenção (1h) + 15 → 12:30 almoço (bloqueado)
   * → 13:45 Esmaltação em gel (1h30) + 15 → livre para agendar 15:30–19:00
   */
  const appointments = [
    { startsAt: at(9), endsAt: at(11, 15) },
    { startsAt: at(11, 15), endsAt: at(12, 30) },
    { startsAt: at(13, 45), endsAt: at(15, 30) },
  ]

  it("sobra exatamente o intervalo 15:30–19:00", () => {
    expect(getFreeIntervals(day, input({ appointments }))).toEqual([
      { start: h(15, 30), end: h(19) },
    ])
  })

  it("para uma manutenção (1h + 15) os inícios vão de 15:30 a 17:45", () => {
    const slots = starts(getAvailableSlots(day, input({ appointments, service: manutencao })))
    expect(slots[0]).toBe("15:30")
    expect(slots.at(-1)).toBe("17:45")
    expect(slots).toHaveLength(10)
  })

  it("para um alongamento (2h + 15) os inícios vão de 15:30 a 16:45", () => {
    const slots = starts(getAvailableSlots(day, input({ appointments })))
    expect(slots).toEqual(["15:30", "15:45", "16:00", "16:15", "16:30", "16:45"])
  })
})

describe("mês e conflito", () => {
  it("classifica os dias do mês: fechado, lotado, disponível", () => {
    const exceptions = [{ type: "BLOCK" as const, startsAt: at(0, 0, 20), endsAt: at(0, 0, 21) }]
    /* dia 6 lotado: um bloqueio de dia quase inteiro deixa só 30 min livres */
    const almostFull = [{ type: "BLOCK" as const, startsAt: at(9, 30, 6), endsAt: at(19, 0, 6) }]
    const month = getMonthAvailability(
      2026,
      10,
      input({ exceptions: [...exceptions, ...almostFull] }),
    )
    expect(month["2026-11-01"]).toBe("closed") // domingo
    expect(month["2026-11-20"]).toBe("closed") // feriado bloqueado
    expect(month["2026-11-06"]).toBe("full")
    expect(month["2026-11-05"]).toBe("available")
    expect(Object.keys(month)).toHaveLength(30)
  })

  it("calcula um mês inteiro com 150 agendamentos em menos de 50 ms", () => {
    const appointments = Array.from({ length: 150 }, (_, i) => {
      const d = (i % 25) + 2
      const start = at(9 + (i % 4) * 2, 0, d)
      return { startsAt: start, endsAt: new Date(start.getTime() + 75 * 60_000) }
    })
    const t0 = performance.now()
    getMonthAvailability(2026, 10, input({ appointments }))
    expect(performance.now() - t0).toBeLessThan(50)
  })

  it("detecta conflito e permite ignorar o próprio agendamento ao remarcar", () => {
    const appointments = [{ startsAt: at(14, 15), endsAt: at(16, 30) }]
    expect(hasConflict(at(16), at(17), appointments)).toBe(true)
    expect(hasConflict(at(16, 30), at(17, 30), appointments)).toBe(false)
    expect(hasConflict(at(14, 15), at(16, 30), appointments, 0)).toBe(false)
  })

  it("isBookable: dentro do expediente e sem conflito", () => {
    const base = input({ appointments: [{ startsAt: at(14, 15), endsAt: at(16, 30) }] })
    expect(isBookable(at(16, 30), at(18, 45), base)).toBe(true)
    expect(isBookable(at(17), at(19, 15), base)).toBe(false) // passa das 19:00
    expect(isBookable(at(15), at(17, 15), base)).toBe(false) // conflito
    expect(isBookable(at(12), at(13), base)).toBe(false) // almoço
    expect(isBookable(at(10, 0, 1), at(11, 0, 1), base)).toBe(false) // domingo
  })
})
