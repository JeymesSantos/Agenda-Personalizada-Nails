import { PageHeader } from "@/components/layout/page-header"
import { MediaLibrary } from "@/features/backgrounds/components/media-library"
import { PageAssignments } from "@/features/backgrounds/components/page-assignments"
import { BACKGROUND_PAGES } from "@/features/backgrounds/pages"
import { listBackgroundMedia, listBackgroundSettings } from "@/features/backgrounds/queries"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { isBlobStorage } from "@/lib/storage"

export const metadata = { title: "Fundos" }

/* Mídias de fundo: biblioteca de fotos/vídeos e qual aparece em cada tela. */
export default async function FundosPage() {
  const user = await requireAdmin()
  const business = await prisma.business.findUniqueOrThrow({
    where: { ownerId: user.id },
    select: { id: true },
  })
  const [media, settings] = await Promise.all([
    listBackgroundMedia(business.id),
    listBackgroundSettings(business.id),
  ])
  const veilOf = new Map(settings.map((s) => [s.page, s.veil]))
  const library = media.map((m) => ({
    id: m.id,
    kind: m.kind,
    url: m.url,
    posterUrl: m.posterUrl,
    name: m.name,
    pages: m.assignments.map((a) => a.page),
    focusX: m.focusX,
    focusY: m.focusY,
  }))
  const pages = BACKGROUND_PAGES.map((p) => ({
    key: p.key,
    area: p.area,
    label: p.label,
    isDefault: Boolean(p.isDefault),
    mediaIds: media
      .flatMap((m) =>
        m.assignments.filter((a) => a.page === p.key).map((a) => ({ id: m.id, order: a.order })),
      )
      .sort((a, b) => a.order - b.order)
      .map((a) => a.id),
    veil: veilOf.get(p.key) ?? null,
  }))

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-5 py-6 lg:px-10 lg:py-8">
      <PageHeader
        eyebrow={`Fundos · ${media.length} mídia${media.length === 1 ? "" : "s"}`}
        variant="heading"
        title="Fundos das telas"
        description="As fotos e vídeos que passam atrás da sua página e do painel."
      />
      <MediaLibrary
        media={library}
        uploadMode={isBlobStorage() ? "blob" : "local"}
        pathPrefix={`backgrounds/${business.id}`}
      />
      <PageAssignments pages={pages} library={library} />
    </main>
  )
}
