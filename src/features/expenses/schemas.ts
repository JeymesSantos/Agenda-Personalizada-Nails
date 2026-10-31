import { z } from "zod"

import { parseCents } from "@/lib/money"

export const DEFAULT_CATEGORIES = [
  "Aluguel",
  "Materiais e descartáveis",
  "Contas (energia, internet)",
  "Cursos",
  "Sistema e domínio",
  "Marketing",
  "Outros",
]

export const expenseSchema = z.object({
  description: z.string().trim().min(2, "Informe a descrição").max(120, "Descrição muito longa"),
  amount: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const cents = parseCents(v)
      if (cents == null || cents <= 0) {
        ctx.addIssue({ code: "custom", message: "Informe um valor válido" })
        return z.NEVER
      }
      return cents
    }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data"),
  category: z.string().trim().min(2, "Escolha a categoria").max(60),
  type: z.enum(["FIXED", "VARIABLE"]),
  recurring: z.coerce.boolean().default(false),
  receiptUrl: z.string().optional().or(z.literal("")),
})

export type ExpenseInput = z.input<typeof expenseSchema>

export type ExpenseFormState = {
  error?: string
  fieldErrors?: Partial<Record<keyof ExpenseInput, string[] | undefined>>
  success?: string
}
