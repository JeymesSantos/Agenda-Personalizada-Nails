import "server-only"

import { prisma } from "@/lib/prisma"

export type ClientSummary = {
  id: string
  name: string
  whatsapp: string | null
  email: string | null
  registered: boolean
  visits: number
  spentCents: number
  lastVisitAt: Date | null
  nextAt: Date | null
  createdAt: Date
}

/**
 * Inclui contas cadastradas mesmo antes do primeiro agendamento.
 * O histórico e os indicadores continuam restritos ao estúdio consultado.
 */
export async function listClients(
  businessId: string,
  q = "",
  now = new Date(),
): Promise<ClientSummary[]> {
  const term = q.trim()
  const digits = term.replace(/\D/g, "")

  const [grouped, nextRows] = await Promise.all([
    prisma.appointment.groupBy({
      by: ["clientId"],
      where: { businessId, status: "DONE" },
      _count: { _all: true },
      _sum: { priceCents: true },
      _max: { startsAt: true },
    }),
    prisma.appointment.findMany({
      where: { businessId, status: { in: ["PENDING", "CONFIRMED"] }, startsAt: { gte: now } },
      select: { clientId: true, startsAt: true },
      orderBy: { startsAt: "asc" },
    }),
  ])

  const users = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      AND: [{ OR: [{ passwordHash: { not: null } }, { appointments: { some: { businessId } } }] }],
      ...(term.length > 0
        ? {
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              ...(digits.length >= 3 ? [{ whatsapp: { contains: digits } }] : []),
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  })

  const nextByClient = new Map<string, Date>()
  for (const r of nextRows)
    if (!nextByClient.has(r.clientId)) nextByClient.set(r.clientId, r.startsAt)

  return users.map((u) => {
    const g = grouped.find((x) => x.clientId === u.id)
    return {
      id: u.id,
      name: u.name,
      whatsapp: u.whatsapp,
      email: u.email,
      registered: Boolean(u.passwordHash),
      visits: g?._count._all ?? 0,
      spentCents: g?._sum.priceCents ?? 0,
      lastVisitAt: g?._max.startsAt ?? null,
      nextAt: nextByClient.get(u.id) ?? null,
      createdAt: u.createdAt,
    }
  })
}

export async function getClientProfile(businessId: string, clientId: string, now = new Date()) {
  const user = await prisma.user.findFirst({ where: { id: clientId, role: "CLIENT" } })
  if (!user) return null
  const [appointments, notes] = await Promise.all([
    prisma.appointment.findMany({
      where: { businessId, clientId },
      include: { service: { select: { title: true, durationMin: true } } },
      orderBy: { startsAt: "desc" },
    }),
    prisma.clientNote.findMany({ where: { businessId, clientId }, orderBy: { createdAt: "desc" } }),
  ])
  const done = appointments.filter((a) => a.status === "DONE")
  const upcoming = appointments
    .filter((a) => (a.status === "PENDING" || a.status === "CONFIRMED") && a.endsAt >= now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
  const past = appointments.filter((a) => !upcoming.includes(a))
  return {
    user,
    appointments,
    upcoming,
    past,
    notes,
    visits: done.length,
    spentCents: done.reduce((s, a) => s + a.priceCents, 0),
    lastVisitAt: done[0]?.startsAt ?? null,
    noShows: appointments.filter((a) => a.status === "NO_SHOW").length,
    cancellations: appointments.filter((a) => a.status === "CANCELLED").length,
  }
}
