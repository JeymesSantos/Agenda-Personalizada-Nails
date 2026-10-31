import { z } from "zod"

import { parseCents } from "@/lib/money"

export const serviceSchema = z.object({
  title: z.string().trim().min(2, "Informe o título do serviço").max(80, "Título muito longo"),
  description: z.string().trim().max(600, "Descrição muito longa").optional().or(z.literal("")),
  categoryId: z.string().trim().optional().or(z.literal("")),
  durationMin: z.coerce
    .number()
    .int()
    .min(15, "Mínimo de 15 minutos")
    .max(8 * 60, "Máximo de 8 horas"),
  bufferMin: z.coerce.number().int().min(0).max(120, "Máximo de 2 horas"),
  price: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const cents = parseCents(v)
      if (cents == null || cents < 0) {
        ctx.addIssue({ code: "custom", message: "Informe um valor válido" })
        return z.NEVER
      }
      return cents
    }),
  priceFrom: z.coerce.boolean().default(false),
  visible: z.coerce.boolean().default(true),
  photoUrls: z.array(z.string().min(1)).max(6, "No máximo 6 fotos").default([]),
})

export type ServiceInput = z.input<typeof serviceSchema>
export type ServiceValues = z.output<typeof serviceSchema>

export type ServiceFormState = {
  error?: string
  fieldErrors?: Partial<Record<keyof ServiceInput, string[] | undefined>>
  success?: boolean
}

export const DURATION_STEP = 15
export const BUFFER_STEP = 5
