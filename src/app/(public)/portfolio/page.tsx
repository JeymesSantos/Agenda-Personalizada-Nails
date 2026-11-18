import type { Metadata } from "next"
import { PortfolioMedia } from "@/features/portfolio/components/portfolio-media"
import Link from "next/link"
import { cn } from "cn"
import { ArrowUpRightIcon, CalendarIcon, SparklesIcon, XIcon } from "lucide-react"

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
  const cover = photos.find((p) => p.isCover) ?? photos[0]
  const filterHref = (id?: string) => (id ? `/portfolio?album=${id}` : "/portfolio")

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-5 pt-8 pb-12 lg:gap-10 lg:px-10 lg:pt-12">
      <PageHeader
        eyebrow="Trabalhos recentes"
        title="Portfólio"
        description="Explore fotos e vídeos, veja os detalhes e agende o seu próximo favorito."
      />

      {cover && !selected ? (
        <section
          className="bg-surface border-subtle grid overflow-hidden rounded-lg border md:grid-cols-2"
          aria-label="Inspiração em destaque"
        >
          <Link
            href={`${filterHref(albumId)}${albumId ? "&" : "?"}foto=${cover.id}#foto`}
            className="group relative block aspect-[4/3] overflow-hidden md:aspect-square"
            aria-label={`Ver destaque: ${cover.caption ?? "Trabalho do studio"}`}
          >
            <PortfolioMedia
              src={cover.url}
              alt={cover.caption ?? "Trabalho em destaque"}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
              priority
            />
            <span className="bg-base/80 absolute top-4 left-4 flex items-center gap-2 rounded-full px-3 py-2 text-sm backdrop-blur">
              <SparklesIcon className="size-4 text-pink-300" /> Escolha do studio
            </span>
          </Link>
          <div className="flex flex-col justify-center gap-5 p-6 md:p-10">
            <p className="display-label text-pink-300">Seu próximo favorito</p>
            <h2 className="type-h1 text-balance">Beleza em cada detalhe.</h2>
            <p className="type-body-l text-secondary-txt">
              {cover.caption ??
                "Cores, texturas e acabamentos para expressar o seu estilo. Encontre sua inspiração e deixe o resto com a gente."}
            </p>
            <Button asChild className="w-fit">
              <Link
                href={
                  cover.service?.visible && cover.wantThis
                    ? `/agendar/${cover.service.id}/horario`
                    : "/agendar"
                }
              >
                Agendar meu momento <ArrowUpRightIcon />
              </Link>
            </Button>
          </div>
        </section>
      ) : null}

      <nav
        aria-label="Álbuns do portfólio"
        className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
      >
        <Link
          href={filterHref()}
          aria-current={!albumId ? "page" : undefined}
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
            aria-current={albumId === a.id ? "page" : undefined}
            className={cn(
              "type-body-medium border-strong text-secondary-txt inline-flex h-10 shrink-0 items-center rounded-full border px-4",
              albumId === a.id && "border-magenta-500 bg-magenta-500/10 text-pink-300",
            )}
          >
            {a.name}
          </Link>
        ))}
      </nav>

      {selected ? (
        <section
          id="foto"
          aria-label="Trabalho selecionado"
          className="bg-surface border-subtle flex scroll-mt-6 flex-col gap-4 rounded-lg border p-4 lg:flex-row lg:items-center lg:gap-8 lg:p-6"
        >
          <div className="bg-surface-2 relative aspect-square w-full overflow-hidden rounded-md lg:w-[360px] lg:shrink-0">
            <PortfolioMedia
              src={selected.url}
              alt={selected.caption ?? ""}
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
        <EmptyState
          title="Nenhum trabalho por aqui ainda"
          description="Em breve novas fotos e vídeos."
        />
      ) : (
        <ul
          aria-label="Trabalhos do portfólio"
          className="columns-2 gap-3 space-y-3 md:columns-3 md:gap-5 md:space-y-5"
        >
          {photos.map((p, i) => (
            <li key={p.id} className="break-inside-avoid">
              <Link
                href={`${filterHref(albumId)}${albumId ? "&" : "?"}foto=${p.id}#foto`}
                className={cn(
                  "bg-surface-2 group relative block overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-300",
                  i % 3 === 0 ? "aspect-[3/4]" : "aspect-square",
                  selected?.id === p.id && "ring-2 ring-pink-300",
                )}
                aria-label={`Ver trabalho: ${p.caption ?? p.service?.title ?? "Inspiração do studio"}`}
              >
                <PortfolioMedia
                  src={p.url}
                  alt={p.caption ?? ""}
                  sizes="(min-width: 1024px) 260px, 50vw"
                  className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-3 pt-16 pb-4 md:px-5">
                  {p.album ? (
                    <p className="mb-1 text-xs font-medium tracking-wide text-pink-300">
                      {p.album.name}
                    </p>
                  ) : null}
                  <p className="line-clamp-2 text-sm font-medium text-white md:text-base">
                    {p.caption ?? p.service?.title ?? "Feito com cuidado"}
                  </p>
                </div>
                {p.service && p.service.visible && p.wantThis ? (
                  <span className="bg-base/80 type-caption text-foreground absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 backdrop-blur">
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
