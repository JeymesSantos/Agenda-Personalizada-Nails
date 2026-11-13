"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export type ReminderActionResult = { error?: string; success?: string }

/* WhatsApp ainda é manual: a profissional envia pelo link wa.me e marca aqui. */
export async function markReminderSentAction(id: string): Promise<ReminderActionResult> {
  const user = await requireAdmin()
  const r = await prisma.reminder.findFirst({
    where: { id, appointment: { business: { ownerId: user.id } } },
    select: { id: true, status: true },
  })
  if (!r) return { error: "Lembrete não encontrado." }
  if (r.status === "SENT") return { success: "Já estava marcado como enviado." }
  await prisma.reminder.update({
    where: { id },
    data: { status: "SENT", sentAt: new Date(), error: null },
  })
  revalidatePath("/admin/agenda")
  return { success: "Lembrete marcado como enviado." }
}
