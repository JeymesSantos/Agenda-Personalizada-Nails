import "server-only"
import { TZDate } from "@date-fns/tz"
import { addDays } from "date-fns"

import { slotsForDay } from "@/features/booking/core"
import { dayKey } from "@/features/agenda/queries"
import { prisma } from "@/lib/prisma"
import type { Slot } from "@/lib/scheduling"

/** O estúdio da página pública (v1: um único estúdio). */
export async function getPublicBusiness() {
  return prisma.business.findFirst({ orderBy: { createdAt: "asc" } })
}

export async function getPublicBusinessOrThrow() {
  const b = await getPublicBusiness()
  if (!b) throw new Error("Nenhum estúdio cadastrado.")
  return b
}

export async function listPublicServices(businessId: string) {
  return prisma.service.findMany({
    where: { businessId, visible: true },
    include: { category: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  })
}

export async function getPublicService(businessId: string, id: string) {
  return prisma.service.findFirst({
    where: { id, businessId, visible: true },
    include: { category: true },
  })
}

/*
 * Fotos dos destaques da bio: até `max` marcadas como destaque; se houver
 * menos de `min`, completa com as primeiras do portfólio para a grade não
 * ficar vazia. A grade mostra `min` quadros e roda pelas demais.
 */
export async function listFeaturedPhotos(businessId: string, min = 4, max = 12) {
  const featured = await prisma.photo.findMany({
    where: { businessId, featuredOnBio: true },
    orderBy: [{ isCover: "desc" }, { order: "asc" }],
    take: max,
  })
  if (featured.length >= min) return featured
  const more = await prisma.photo.findMany({
    where: { businessId, id: { notIn: featured.map((p) => p.id) } },
    orderBy: [{ isCover: "desc" }, { order: "asc" }],
    take: min - featured.length,
  })
  return [...featured, ...more]
}

export async function listPublicPhotos(businessId: string, albumId?: string) {
  return prisma.photo.findMany({
    where: { businessId, ...(albumId ? { albumId } : {}) },
    include: {
      service: { select: { id: true, title: true, visible: true } },
      album: { select: { id: true, name: true } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  })
}

export async function listPublicAlbums(businessId: string) {
  return prisma.album.findMany({
    where: { businessId, photos: { some: {} } },
    include: { _count: { select: { photos: true } } },
    orderBy: { order: "asc" },
  })
}

export type NextSlot = { startsAt: Date; label: string; ymd: string; serviceId: string }

/**
 * "Próximos horários livres" da bio: os primeiros `take` inícios possíveis para o
 * serviço mais curto visível, olhando até 14 dias à frente.
 */
export async function getNextFreeSlots(
  businessId: string,
  timezone: string,
  take = 3,
): Promise<NextSlot[]> {
  const services = await prisma.service.findMany({
    where: { businessId, visible: true },
    orderBy: [{ durationMin: "asc" }],
    select: { id: true },
    take: 1,
  })
  const service = services[0]
  if (!service) return []
  const now = new Date()
  const out: NextSlot[] = []
  for (let i = 0; i < 14 && out.length < take; i++) {
    const day = addDays(now, i)
    const ymd = dayKey(day, timezone)
    let slots: Slot[] = []
    try {
      slots = await slotsForDay(businessId, service.id, ymd, { now, minNoticeMin: 30 })
    } catch {
      slots = []
    }
    for (const s of slots) {
      if (out.length >= take) break
      /* no máximo 2 por dia para variar as sugestões */
      if (out.filter((o) => o.ymd === ymd).length >= 2) break
      out.push({
        startsAt: s.startsAt,
        label: labelFor(s.startsAt, i, timezone),
        ymd,
        serviceId: service.id,
      })
    }
  }
  return out
}

const SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function labelFor(date: Date, dayOffset: number, timezone: string) {
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date)
  if (dayOffset === 0) return `Hoje ${time}`
  if (dayOffset === 1) return `Amanhã ${time}`
  const weekday = new TZDate(date, timezone).getDay()
  return `${SHORT[weekday]} ${time}`
}
