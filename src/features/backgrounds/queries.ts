import "server-only"

import type { BackgroundKind, BackgroundPage, BackgroundVeil } from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

import { type BackgroundArea, defaultPageFor, pagesOfArea } from "./pages"

export type BackgroundItem = {
  id: string
  kind: BackgroundKind
  url: string
  posterUrl: string | null
}

export type BackgroundPageData = { items: BackgroundItem[]; veil: BackgroundVeil }

/* O que o slideshow de uma área precisa: itens e véu por tela, já com a herança do padrão resolvida. */
export type AreaBackgrounds = {
  area: BackgroundArea
  pages: Partial<Record<BackgroundPage, BackgroundPageData>>
}

export async function getAreaBackgrounds(
  businessId: string,
  area: BackgroundArea,
): Promise<AreaBackgrounds> {
  const keys = pagesOfArea(area).map((p) => p.key)
  const [assignments, settings] = await Promise.all([
    prisma.backgroundAssignment.findMany({
      where: { businessId, page: { in: keys } },
      orderBy: [{ page: "asc" }, { order: "asc" }],
      include: { media: { select: { id: true, kind: true, url: true, posterUrl: true } } },
    }),
    prisma.backgroundPageSetting.findMany({ where: { businessId, page: { in: keys } } }),
  ])

  const defaultKey = defaultPageFor(area)
  const veilOf = new Map(settings.map((s) => [s.page, s.veil]))
  const defaultVeil: BackgroundVeil = veilOf.get(defaultKey) ?? "MEDIUM"

  const grouped = new Map<BackgroundPage, BackgroundItem[]>()
  for (const a of assignments) {
    const list = grouped.get(a.page) ?? []
    list.push(a.media)
    grouped.set(a.page, list)
  }
  const defaultItems = grouped.get(defaultKey) ?? []

  const pages: AreaBackgrounds["pages"] = {}
  for (const key of keys) {
    const own = grouped.get(key) ?? []
    pages[key] = {
      items: own.length > 0 ? own : defaultItems,
      veil: veilOf.get(key) ?? defaultVeil,
    }
  }
  return { area, pages }
}

/* Biblioteca completa com as telas de cada mídia (painel /admin/fundos). */
export async function listBackgroundMedia(businessId: string) {
  return prisma.backgroundMedia.findMany({
    where: { businessId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { assignments: { select: { page: true, order: true } } },
  })
}

export async function listBackgroundSettings(businessId: string) {
  return prisma.backgroundPageSetting.findMany({ where: { businessId } })
}
