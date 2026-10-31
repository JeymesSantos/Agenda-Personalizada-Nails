import "server-only"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"

/**
 * Agendamento pelo código do comprovante. Acesso permitido quando o token de
 * gerenciamento confere (?t=) ou quando a cliente logada é a dona.
 */
export async function getAppointmentByCode(code: string, token: string | null) {
  const a = await prisma.appointment.findUnique({
    where: { code },
    include: { service: true, client: true, business: true },
  })
  if (!a) return null
  if (token && token === a.manageToken) return a
  const user = await getCurrentUser()
  if (user?.role === "CLIENT" && user.id === a.clientId) return a
  return null
}
