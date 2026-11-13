import { PageHeader } from "@/components/layout/page-header"
import { MediaLibrary } from "@/features/backgrounds/components/media-library"
import { listBackgroundMedia } from "@/features/backgrounds/queries"
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
  const media = await listBackgroundMedia(business.id)

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-5 py-6 lg:px-10 lg:py-8">
      <PageHeader
        eyebrow={`Fundos · ${media.length} mídia${media.length === 1 ? "" : "s"}`}
        variant="heading"
        title="Fundos das telas"
        description="As fotos e vídeos que passam atrás da sua página e do painel."
      />
      <MediaLibrary
        media={media.map((m) => ({
          id: m.id,
          kind: m.kind,
          url: m.url,
          posterUrl: m.posterUrl,
          name: m.name,
          pages: m.assignments.map((a) => a.page),
        }))}
        uploadMode={isBlobStorage() ? "blob" : "local"}
        pathPrefix={`backgrounds/${business.id}`}
      />
    </main>
  )
}
