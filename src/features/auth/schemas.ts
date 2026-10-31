import { z } from "zod"

export const whatsappSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(
    z
      .string()
      .min(10, "Informe o WhatsApp com DDD")
      .max(13, "WhatsApp inválido")
      .regex(/^\d+$/, "WhatsApp inválido"),
  )

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe a senha"),
  next: z.string().optional(),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Como podemos te chamar?"),
    whatsapp: whatsappSchema,
    email: z.string().trim().toLowerCase().email("Informe um e-mail válido"),
    password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres"),
    confirm: z.string(),
    next: z.string().optional(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "As senhas não conferem",
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

/* Estado devolvido pelas server actions para o useActionState. */
export type FormState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  values?: Record<string, string>
}

/* Só aceita caminhos internos como destino pós-login (evita open redirect). */
export function safeNext(next: string | undefined, fallback: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback
  return next
}
