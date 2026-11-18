"use server"

import { createInvitation } from "@/features/auth/invitation"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export async function inviteClientAction(clientId: string) {
  const admin = await requireAdmin()
  const business = await prisma.business.findUniqueOrThrow({ where: { ownerId: admin.id } })
  const client = await prisma.user.findFirst({
    where: {
      id: clientId,
      role: "CLIENT",
      passwordHash: null,
      appointments: { some: { businessId: business.id } },
    },
  })
  if (!client) return { error: "Cliente não encontrada ou já possui conta." }
  return { path: `/cadastro?convite=${encodeURIComponent(createInvitation(client.id))}` }
}
