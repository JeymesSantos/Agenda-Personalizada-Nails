"use server"

import { createInvitation } from "@/features/auth/invitation"
import { createPasswordReset } from "@/features/auth/password-reset"
import { accessDeliveryMessage, accessWhatsappLink } from "@/features/auth/access-messages"
import { appBaseUrl } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export async function createClientAccessLinkAction(clientId: string) {
  const admin = await requireAdmin()
  const business = await prisma.business.findUniqueOrThrow({ where: { ownerId: admin.id } })
  const client = await prisma.user.findFirst({
    where: {
      id: clientId,
      role: "CLIENT",
      appointments: { some: { businessId: business.id } },
    },
  })
  if (!client) return { error: "Cliente não encontrada." }
  if (!client.whatsapp) return { error: "Cadastre o WhatsApp da cliente antes de gerar o link." }
  const reset = Boolean(client.passwordHash)
  const path = client.passwordHash
    ? `/redefinir-senha?token=${encodeURIComponent(createPasswordReset({ ...client, passwordHash: client.passwordHash }))}`
    : `/cadastro?convite=${encodeURIComponent(createInvitation(client.id))}`
  const url = `${appBaseUrl()}${path}`
  const message = accessDeliveryMessage(client.name, business.name, url, reset)
  return { url, message, whatsappUrl: accessWhatsappLink(client.whatsapp, message) }
}
