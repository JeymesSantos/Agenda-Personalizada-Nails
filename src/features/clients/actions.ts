"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { whatsappSchema } from "@/features/auth/schemas"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

async function ownerBusiness() {
  const user = await requireAdmin()
  return prisma.business.findUniqueOrThrow({ where: { ownerId: user.id }, select: { id: true } })
}

export type ClientActionResult = { error?: string; success?: string }

export async function addClientNoteAction(
  clientId: string,
  text: string,
): Promise<ClientActionResult> {
  const business = await ownerBusiness()
  const trimmed = text.trim()
  if (trimmed.length < 2) return { error: "Escreva uma anotação." }
  if (trimmed.length > 500) return { error: "Anotação muito longa (máx. 500 caracteres)." }
  await prisma.clientNote.create({ data: { businessId: business.id, clientId, text: trimmed } })
  revalidatePath(`/admin/clientes/${clientId}`)
  return { success: "Anotação salva." }
}

export async function deleteClientNoteAction(noteId: string): Promise<ClientActionResult> {
  const business = await ownerBusiness()
  const note = await prisma.clientNote.findFirst({ where: { id: noteId, businessId: business.id } })
  if (!note) return { error: "Anotação não encontrada." }
  await prisma.clientNote.delete({ where: { id: noteId } })
  revalidatePath(`/admin/clientes/${note.clientId}`)
  return { success: "Anotação removida." }
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  whatsapp: whatsappSchema.optional().or(z.literal("")),
})

export async function updateClientContactAction(
  clientId: string,
  _prev: ClientActionResult,
  formData: FormData,
): Promise<ClientActionResult> {
  await ownerBusiness()
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    whatsapp: String(formData.get("whatsapp") ?? ""),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  const whatsapp = parsed.data.whatsapp || null
  if (whatsapp) {
    const other = await prisma.user.findFirst({ where: { whatsapp, id: { not: clientId } } })
    if (other) return { error: "Esse WhatsApp já pertence a outra cliente." }
  }
  await prisma.user.update({ where: { id: clientId }, data: { name: parsed.data.name, whatsapp } })
  revalidatePath(`/admin/clientes/${clientId}`)
  revalidatePath("/admin/clientes")
  revalidatePath("/admin/agenda")
  return { success: "Contato atualizado." }
}
