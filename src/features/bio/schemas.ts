import { z } from "zod"

import { whatsappSchema } from "@/features/auth/schemas"

export const bioSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(60, "Nome muito longo"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Mínimo de 3 caracteres")
    .max(40, "Máximo de 40 caracteres")
    .regex(/^[a-z0-9-]+$/, "Use só letras minúsculas, números e hífen"),
  tagline: z.string().trim().max(120, "Máximo de 120 caracteres").optional().or(z.literal("")),
  description: z.string().trim().max(400, "Máximo de 400 caracteres").optional().or(z.literal("")),
  instagram: z
    .string()
    .trim()
    .max(40)
    .transform((v) => v.replace(/^@/, ""))
    .optional()
    .or(z.literal("")),
  whatsapp: whatsappSchema.optional().or(z.literal("")),
  addressLine: z.string().trim().max(120).optional().or(z.literal("")),
  neighborhood: z.string().trim().max(60).optional().or(z.literal("")),
  hoursSummary: z.string().trim().max(60).optional().or(z.literal("")),
  statsAppointments: z.string().trim().max(20).optional().or(z.literal("")),
  statsRating: z.string().trim().max(10).optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
  photoUrl: z.string().optional().or(z.literal("")),
  cancelMinHours: z.coerce.number().int().min(0, "Mínimo 0").max(168, "Máximo 168 h"),
})

export type BioInput = z.input<typeof bioSchema>

export type BioFormState = {
  error?: string
  fieldErrors?: Partial<Record<keyof BioInput, string[] | undefined>>
  success?: string
}
