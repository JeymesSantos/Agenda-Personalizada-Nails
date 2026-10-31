import { z } from "zod"

const time = z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida")

export function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number)
  return h * 60 + m
}

export function minutesToTime(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`
}

export const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const

export const workingDaySchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    enabled: z.coerce.boolean(),
    start: time,
    end: time,
    breakStart: time.optional().or(z.literal("")),
    breakEnd: time.optional().or(z.literal("")),
  })
  .superRefine((d, ctx) => {
    if (!d.enabled) return
    const s = timeToMinutes(d.start)
    const e = timeToMinutes(d.end)
    if (e <= s)
      ctx.addIssue({ code: "custom", path: ["end"], message: "O fim precisa ser depois do início" })
    const hasBreak = Boolean(d.breakStart) !== Boolean(d.breakEnd)
    if (hasBreak)
      ctx.addIssue({ code: "custom", path: ["breakEnd"], message: "Informe início e fim da pausa" })
    if (d.breakStart && d.breakEnd) {
      const bs = timeToMinutes(d.breakStart)
      const be = timeToMinutes(d.breakEnd)
      if (be <= bs)
        ctx.addIssue({
          code: "custom",
          path: ["breakEnd"],
          message: "A pausa precisa terminar depois de começar",
        })
      if (bs < s || be > e)
        ctx.addIssue({
          code: "custom",
          path: ["breakStart"],
          message: "A pausa precisa ficar dentro do expediente",
        })
    }
  })

export const workingHoursSchema = z.array(workingDaySchema).length(7)

export type WorkingDayInput = z.input<typeof workingDaySchema>

export const exceptionSchema = z
  .object({
    type: z.enum(["BLOCK", "RELEASE"]),
    mode: z.enum(["month", "days", "range"]),
    month: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .optional()
      .or(z.literal("")),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal("")),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal("")),
    startTime: time.optional().or(z.literal("")),
    endTime: time.optional().or(z.literal("")),
    reason: z.string().trim().max(120, "Motivo muito longo").optional().or(z.literal("")),
  })
  .superRefine((d, ctx) => {
    if (d.mode === "month" && !d.month)
      ctx.addIssue({ code: "custom", path: ["month"], message: "Escolha o mês" })
    if (d.mode === "days") {
      if (!d.startDate)
        ctx.addIssue({ code: "custom", path: ["startDate"], message: "Informe a data inicial" })
      if (d.startDate && d.endDate && d.endDate < d.startDate)
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "A data final precisa ser depois da inicial",
        })
    }
    if (d.mode === "range") {
      if (!d.startDate)
        ctx.addIssue({ code: "custom", path: ["startDate"], message: "Informe a data" })
      if (!d.startTime || !d.endTime)
        ctx.addIssue({ code: "custom", path: ["endTime"], message: "Informe de e até" })
      else if (timeToMinutes(d.endTime) <= timeToMinutes(d.startTime))
        ctx.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "O fim precisa ser depois do início",
        })
    }
  })

export type ExceptionInput = z.input<typeof exceptionSchema>

export type AvailabilityFormState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  success?: string
}
