import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { cn } from "cn"
import { CalendarIcon, XIcon } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import {
  getPublicBusinessOrThrow,
  listPublicAlbums,
  listPublicPhotos,
} from "@/features/public/queries"

export const metadata: Metadata = { title: "Portfólio" }

/* Portfólio público (M2): filtros por álbum, grade 2 colunas, foto em destaque com "Quero esse". */
export default async function PortfolioPublicPage({ searchParams }: PageProps<"/portfolio">) {
  const sp = await searchParams
  const b = await getPublicBusinessOrThrow()
  const albumId = typeof sp.album === "string" ? sp.album : undefined
  const photoId = typeof sp.foto === "string" ? sp.foto : undefined
  const [albums, photos] = await Promise.all([
    listPublicAlbums(b.id),
    listPublicPhotos(b.id, albumId),
  ])
  const selected = photoId ? photos.find((p) => p.id === photoId) : undefined
  const filterHref = (id?: string) => (id ? `/portfolio?album=${id}` : "/portfolio")

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-5 pt-8 pb-10 lg:px-10 lg:pt-12">
      <PageHeader
        eyebrow="Trabalhos recentes"
        title="Portfólio"
        description="Toque em uma foto para ver detalhes e agendar o mesmo serviço."
      />

      <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        <Link
          href={filterHref()}
          className={cn(
            "type-body-medium border-strong text-secondary-txt inline-flex h-10 shrink-0 items-center rounded-full border px-4",
            !albumId && "border-magenta-500 bg-magenta-500/10 text-pink-300",
          )}
        >
          Todos
        </Link>
        {albums.map((a) => (
          <Link
            key={a.id}
            href={filterHref(a.id)}
            className={cn(
              "type-body-medium border-strong text-secondary-txt inline-flex h-10 shrink-0 items-center rounded-full border px-4",
              albumId === a.id && "border-magenta-500 bg-magenta-500/10 text-pink-300",
            )}
          >
            {a.name}
          </Link>
        ))}
      </div>

      {selected ? (
        <section className="bg-surface border-subtle flex flex-col gap-4 rounded-lg border p-4 lg:flex-row lg:items-center lg:gap-8 lg:p-6">
          <div className="bg-surface-2 relative aspect-square w-full overflow-hidden rounded-md lg:w-[360px] lg:shrink-0">
            <Image
              src={selected.url}
              alt={selected.caption ?? ""}
              fill
              sizes="(min-width: 1024px) 360px, 100vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-1 flex-col gap-3">
            {selected.album ? (
              <p className="display-label text-pink-300">{selected.album.name}</p>
            ) : null}
            <h2 className="type-h2">{selected.caption ?? "Trabalho da Letícia"}</h2>
            {selected.service && selected.service.visible ? (
              <p className="type-body text-secondary-txt">Serviço: {selected.service.title}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-3">
              {selected.service && selected.service.visible && selected.wantThis ? (
                <Button asChild>
                  <Link href={`/agendar/${selected.service.id}/horario`}>
                    <CalendarIcon /> Quero esse
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/agendar">
                    <CalendarIcon /> Agendar horário
                  </Link>
                </Button>
              )}
              <Button asChild variant="secondary">
                <Link href={filterHref(albumId)}>
                  <XIcon /> Fechar
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {photos.length === 0 ? (
        <EmptyState title="Nenhuma foto por aqui ainda" description="Em breve novos trabalhos." />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((p, i) => (
            <li key={p.id} className={cn(i % 5 === 0 ? "row-span-2" : "")}>
              <Link
                href={`${filterHref(albumId)}${albumId ? "&" : "?"}foto=${p.id}#foto`}
                className={cn(
                  "bg-surface-2 group relative block h-full min-h-[160px] overflow-hidden rounded-md",
                  i % 5 === 0 ? "aspect-[4/5]" : "aspect-square",
                  selected?.id === p.id && "ring-2 ring-pink-300",
                )}
              >
                <Image
                  src={p.url}
                  alt={p.caption ?? ""}
                  fill
                  sizes="(min-width: 1024px) 260px, 50vw"
                  className="object-cover transition-transform group-hover:scale-[1.03]"
                />
                {p.service && p.service.visible && p.wantThis ? (
                  <span className="bg-base/80 type-caption text-foreground absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 backdrop-blur">
                    <CalendarIcon className="size-3.5" /> Quero esse
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
