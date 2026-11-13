import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  AtSignIcon,
  ChevronRightIcon,
  ClockIcon,
  MessageCircleIcon,
  SparklesIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ServiceCard } from "@/features/services/components/service-card"
import {
  getNextFreeSlots,
  getPublicBusinessOrThrow,
  listFeaturedPhotos,
  listPublicServices,
} from "@/features/public/queries"

export async function generateMetadata(): Promise<Metadata> {
  const b = await getPublicBusinessOrThrow()
  return {
    title: { absolute: `${b.name} · Agenda online` },
    description: b.tagline ?? b.description ?? "Agende seu horário online.",
    openGraph: {
      title: `${b.name} · Agenda online`,
      description: b.tagline ?? undefined,
      images: b.logoUrl ? [{ url: b.logoUrl }] : undefined,
    },
  }
}

function LinkCard({
  href,
  icon,
  title,
  subtitle,
  external = false,
}: {
  href: string
  icon: React.ReactNode
  title: string
  subtitle: string
  external?: boolean
}) {
  const className =
    "bg-surface border-subtle hover:bg-surface-2 flex items-center gap-4 rounded-md border p-4 transition-colors [&_svg]:size-5"
  const inner = (
    <>
      <span className="bg-magenta-500/18 flex size-11 shrink-0 items-center justify-center rounded-sm text-pink-300">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="type-body-medium">{title}</span>
        <span className="type-body text-secondary-txt truncate">{subtitle}</span>
      </span>
      <ChevronRightIcon className="text-muted-txt" />
    </>
  )
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={className}>
      {inner}
    </Link>
  )
}

function PhotoTile({ url, className }: { url: string; className?: string }) {
  return (
    <div className={`bg-surface-2 relative overflow-hidden rounded-md ${className ?? ""}`}>
      <Image
        src={url}
        alt=""
        fill
        sizes="(min-width: 1024px) 260px, 33vw"
        className="object-cover"
      />
    </div>
  )
}

/* Bio / Início — M1 (mobile) e D1 (desktop). */
export default async function HomePage() {
  const b = await getPublicBusinessOrThrow()
  const [services, photos, nextSlots] = await Promise.all([
    listPublicServices(b.id),
    listFeaturedPhotos(b.id, 4),
    getNextFreeSlots(b.id, b.timezone, 3),
  ])
  const instagramUrl = b.instagram ? `https://instagram.com/${b.instagram}` : null
  const whatsappUrl = b.whatsapp ? `https://wa.me/55${b.whatsapp}` : null

  return (
    <main className="flex flex-col">
      {/* ---------- MOBILE (M1) ---------- */}
      <section className="flex flex-col gap-6 px-5 pt-10 pb-6 lg:hidden">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-surface-2 relative size-[100px] overflow-hidden rounded-full">
            {b.logoUrl ? (
              <Image
                src={b.logoUrl}
                alt=""
                fill
                sizes="100px"
                className="object-cover"
                unoptimized={b.logoUrl.endsWith(".svg")}
              />
            ) : null}
          </div>
          <h1 className="display-l text-[28px] leading-9 tracking-[0.12em]">{b.name}</h1>
          {b.tagline ? <p className="type-body-l text-secondary-txt">{b.tagline}</p> : null}
          <div className="type-body text-secondary-txt flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {b.hoursSummary ? (
              <span className="flex items-center gap-1.5">
                <ClockIcon className="size-4" /> {b.hoursSummary}
              </span>
            ) : null}
            {b.statsAppointments ? (
              <span className="flex items-center gap-1.5">
                <SparklesIcon className="size-4" /> {b.statsAppointments} atendimentos
              </span>
            ) : null}
          </div>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/agendar">Agendar horário</Link>
        </Button>

        {nextSlots.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="type-h3">Próximos horários livres</h2>
              <Link href="/agendar" className="type-body-medium text-pink-300">
                Ver agenda
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {nextSlots.map((s) => (
                <Link
                  key={s.startsAt.toISOString()}
                  href={`/agendar/${s.serviceId}/horario?data=${s.ymd}&h=${encodeURIComponent(s.startsAt.toISOString())}`}
                  className="type-body-medium bg-surface-2 border-subtle hover:border-strong flex h-12 items-center justify-center rounded-sm border px-2 text-center"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          {instagramUrl ? (
            <LinkCard
              href={instagramUrl}
              external
              icon={<AtSignIcon />}
              title="Instagram"
              subtitle={`@${b.instagram}`}
            />
          ) : null}
          {whatsappUrl ? (
            <LinkCard
              href={whatsappUrl}
              external
              icon={<MessageCircleIcon />}
              title="WhatsApp"
              subtitle="Tire dúvidas antes de agendar"
            />
          ) : null}
          <LinkCard
            href="/servicos"
            icon={<SparklesIcon />}
            title="Serviços e valores"
            subtitle={`${services.length} serviço${services.length === 1 ? "" : "s"} disponíve${services.length === 1 ? "l" : "is"}`}
          />
        </div>

        {photos.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="type-h3">Destaques do portfólio</h2>
              <Link href="/portfolio" className="type-body-medium text-pink-300">
                Ver tudo
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {photos.slice(0, 3).map((p) => (
                <Link key={p.id} href={`/portfolio?foto=${p.id}`}>
                  <PhotoTile url={p.url} className="aspect-[4/5]" />
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* ---------- DESKTOP (D1) ---------- */}
      {/* ocupa a altura da tela abaixo do cabeçalho (88px) com o conteúdo centralizado; as fotos ficam no fundo do layout */}
      <section className="hidden min-h-[calc(100dvh-88px)] flex-col justify-center px-10 pt-16 pb-20 lg:flex xl:px-20">
        <div className="mx-auto grid max-w-[1280px] grid-cols-[minmax(0,1fr)_minmax(0,460px)] items-center gap-10 xl:grid-cols-[minmax(0,1fr)_520px] xl:gap-16">
          <div className="flex flex-col gap-6">
            <p className="display-label text-pink-300">Nail designer · Agenda online</p>
            <h1 className="display-xl">{b.name}</h1>
            {b.description ? (
              <p className="type-body-l text-secondary-txt max-w-[640px]">{b.description}</p>
            ) : null}
            <div className="flex items-center gap-4">
              <Button asChild size="lg">
                <Link href="/agendar">Agendar horário</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/portfolio">Ver portfólio</Link>
              </Button>
            </div>
            <dl className="mt-4 flex items-start gap-10">
              {b.statsAppointments ? (
                <div>
                  <dt className="type-kpi">{b.statsAppointments}</dt>
                  <dd className="type-body text-secondary-txt">atendimentos</dd>
                </div>
              ) : null}
              {b.statsRating ? (
                <div>
                  <dt className="type-kpi">{b.statsRating} ★</dt>
                  <dd className="type-body text-secondary-txt">no Google</dd>
                </div>
              ) : null}
              <div>
                <dt className="type-kpi">{services.length}</dt>
                <dd className="type-body text-secondary-txt">serviços</dd>
              </div>
            </dl>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {photos.slice(0, 4).map((p, i) => (
              <PhotoTile
                key={p.id}
                url={p.url}
                className={
                  i === 0 ? "-mt-8 aspect-[4/5]" : i === 3 ? "-mb-8 aspect-[4/5]" : "aspect-[5/4]"
                }
              />
            ))}
          </div>
        </div>
      </section>

      <section className="hidden px-10 pb-20 lg:block xl:px-20">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="display-label text-pink-300">Catálogo</p>
              <h2 className="type-h1 mt-2">Serviços e valores</h2>
            </div>
            <Link href="/servicos" className="type-body-medium text-pink-300 hover:underline">
              Ver todos os serviços →
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-5">
            {services.slice(0, 4).map((s) => (
              <ServiceCard
                key={s.id}
                href={`/agendar/${s.id}/horario`}
                service={{
                  id: s.id,
                  title: s.title,
                  description: s.description,
                  durationMin: s.durationMin,
                  priceCents: s.priceCents,
                  priceFrom: s.priceFrom,
                  photoUrl: s.photoUrls[0] ?? null,
                }}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
