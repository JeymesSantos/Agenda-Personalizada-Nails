import Link from "next/link"
import { cn } from "cn"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { NewAlbumDialog } from "@/features/portfolio/components/album-dialog"
import { PhotoPanel } from "@/features/portfolio/components/photo-panel"
import { PortfolioGrid } from "@/features/portfolio/components/portfolio-grid"
import { countPhotos, getPhoto, listAlbums, listPhotos } from "@/features/portfolio/queries"
import { listVisibleServices } from "@/features/agenda/queries"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export const metadata = { title: "Portfólio" }

export default async function PortfolioPage({ searchParams }: PageProps<"/admin/portfolio">) {
  const user = await requireAdmin()
  const sp = await searchParams
  const business = await prisma.business.findUniqueOrThrow({ where: { ownerId: user.id } })
  const albumId = typeof sp.album === "string" ? sp.album : null
  const photoId = typeof sp.foto === "string" ? sp.foto : null

  const [albums, photos, total, services, selected] = await Promise.all([
    listAlbums(business.id),
    listPhotos(business.id, albumId ?? undefined),
    countPhotos(business.id),
    listVisibleServices(business.id),
    photoId ? getPhoto(business.id, photoId) : Promise.resolve(null),
  ])

  const chips = [
    { id: null as string | null, label: `Todos (${total})` },
    ...albums.map((a) => ({ id: a.id as string | null, label: `${a.name} (${a._count.photos})` })),
  ]

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-5 py-6 lg:px-10 lg:py-8">
      <PageHeader
        eyebrow={`Portfólio · ${total} foto${total === 1 ? "" : "s"}`}
        variant="heading"
        title="Portfólio"
        actions={
          <>
            <NewAlbumDialog />
            <Button asChild>
              <label htmlFor="portfolio-upload-proxy" className="cursor-pointer">
                Enviar fotos
              </label>
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {chips.map((c) => {
          const active = c.id === albumId
          return (
            <Link
              key={c.id ?? "all"}
              href={c.id ? `/admin/portfolio?album=${c.id}` : "/admin/portfolio"}
              className={cn(
                "type-body-medium border-strong text-secondary-txt hover:text-foreground inline-flex h-10 items-center rounded-full border px-4 transition-colors",
                active && "border-magenta-500 bg-magenta-500/10 text-pink-300",
              )}
            >
              {c.label}
            </Link>
          )
        })}
      </div>

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <PortfolioGrid
            photos={photos.map((p) => ({
              id: p.id,
              url: p.url,
              caption: p.caption,
              isCover: p.isCover,
              featuredOnBio: p.featuredOnBio,
            }))}
            albumId={albumId}
            selectedId={selected?.id ?? null}
          />
        </div>
        {selected ? (
          <aside className="bg-surface border-subtle hidden w-[340px] shrink-0 self-start rounded-md border p-5 lg:block">
            <PhotoPanel
              photo={{
                id: selected.id,
                url: selected.url,
                caption: selected.caption,
                serviceId: selected.serviceId,
                albumId: selected.albumId,
                isCover: selected.isCover,
                featuredOnBio: selected.featuredOnBio,
                wantThis: selected.wantThis,
              }}
              services={services.map((s) => ({ id: s.id, title: s.title }))}
              albums={albums.map((a) => ({ id: a.id, name: a.name }))}
            />
          </aside>
        ) : null}
      </div>
      {selected ? (
        <div className="bg-surface border-subtle rounded-md border p-5 lg:hidden">
          <PhotoPanel
            photo={{
              id: selected.id,
              url: selected.url,
              caption: selected.caption,
              serviceId: selected.serviceId,
              albumId: selected.albumId,
              isCover: selected.isCover,
              featuredOnBio: selected.featuredOnBio,
              wantThis: selected.wantThis,
            }}
            services={services.map((s) => ({ id: s.id, title: s.title }))}
            albums={albums.map((a) => ({ id: a.id, name: a.name }))}
          />
        </div>
      ) : null}
    </main>
  )
}
