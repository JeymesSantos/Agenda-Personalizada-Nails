"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { passwordResetClientId, validPasswordReset } from "./password-reset"
import { resetPasswordSchema, type FormState } from "./schemas"

export async function resetPasswordAction(_prev: FormState, data: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: data.get("password"),
    confirm: data.get("confirm"),
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const token = String(data.get("token") ?? "")
  const id = passwordResetClientId(token)
  const client = id ? await prisma.user.findFirst({ where: { id, role: "CLIENT" } }) : null
  const invalid = { error: "Link inválido, expirado ou já utilizado. Peça um novo link ao studio." }
  if (
    !client?.passwordHash ||
    !validPasswordReset(token, { ...client, passwordHash: client.passwordHash })
  )
    return invalid

  const passwordHash = await bcrypt.hash(parsed.data.password, 10)
  // A troca condicional impede que duas solicitações usem o mesmo link.
  const result = await prisma.user.updateMany({
    where: {
      id: client.id,
      role: "CLIENT",
      passwordHash: client.passwordHash,
      whatsapp: client.whatsapp,
    },
    data: { passwordHash },
  })
  if (result.count !== 1) return invalid
  revalidatePath("/admin/clientes")
  redirect("/entrar?senha=alterada")
}
