import "server-only"

import { prisma } from "@/lib/prisma"
import { totalMinutes, getOpenIntervals } from "@/lib/scheduling"

export async function listServices(businessId: string) {
  return prisma.service.findMany({
    where: { businessId },
    include: { category: true, _count: { select: { appointments: true } } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  })
}

export async function getService(businessId: string, id: string) {
  return prisma.service.findFirst({ where: { id, businessId }, include: { category: true } })
}

export async function listCategories(businessId: string) {
  return prisma.serviceCategory.findMany({ where: { businessId }, orderBy: { order: "asc" } })
}

/**
 * Minutos abertos num dia típico (média dos dias ativos da semana), para o
 * painel "Impacto na agenda": quantos atendimentos do serviço cabem por dia.
 */
export async function typicalOpenMinutes(businessId: string, timezone: string): Promise<number> {
  const workingHours = await prisma.workingHours.findMany({ where: { businessId } })
  const base = new Date(Date.UTC(2026, 0, 5, 12)) // segunda-feira de referência
  let total = 0
  let days = 0
  for (let i = 0; i < 7; i++) {
    const day = new Date(base.getTime() + i * 86_400_000)
    const minutes = totalMinutes(getOpenIntervals(day, { timezone, workingHours, exceptions: [] }))
    if (minutes > 0) {
      total += minutes
      days++
    }
  }
  return days ? Math.round(total / days) : 0
}

export type ServiceListItem = Awaited<ReturnType<typeof listServices>>[number]
