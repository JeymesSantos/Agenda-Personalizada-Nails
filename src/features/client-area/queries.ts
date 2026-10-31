import "server-only"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"

export type ClientAccess =
  { kind: "member"; clientId: string } | { kind: "token"; clientId: string; token: string } | null

/**
 * Quem está acessando "Meus horários": cliente logada ou link com token de
 * gerenciamento (cliente sem cadastro). O token identifica a cliente do agendamento.
 */
export async function resolveClientAccess(token: string | null): Promise<ClientAccess> {
  if (token) {
    const a = await prisma.appointment.findUnique({
      where: { manageToken: token },
      select: { clientId: true },
    })
    if (a) return { kind: "token", clientId: a.clientId, token }
  }
  const user = await getCurrentUser()
  if (user?.role === "CLIENT") return { kind: "member", clientId: user.id }
  return null
}

export async function getMyAppointments(clientId: string, now: Date) {
  const [client, appointments] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: clientId },
      select: { id: true, name: true, whatsapp: true, passwordHash: true },
    }),
    prisma.appointment.findMany({
      where: { clientId },
      include: {
        service: true,
        business: { select: { timezone: true, cancelMinHours: true, whatsapp: true, name: true } },
      },
      orderBy: { startsAt: "desc" },
    }),
  ])
  const upcoming = appointments
    .filter((a) => (a.status === "PENDING" || a.status === "CONFIRMED") && a.endsAt >= now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
  const past = appointments.filter((a) => !upcoming.includes(a))
  return { client, upcoming, past }
}

/** Agendamento da cliente (dona ou token) para remarcar/cancelar. */
export async function getMyAppointment(id: string, access: ClientAccess) {
  if (!access) return null
  const a = await prisma.appointment.findFirst({
    where: { id, clientId: access.clientId },
    include: { service: true, business: true },
  })
  return a
}

export function canChange(startsAt: Date, cancelMinHours: number, now: Date) {
  return startsAt.getTime() - now.getTime() >= cancelMinHours * 60 * 60 * 1000
}
