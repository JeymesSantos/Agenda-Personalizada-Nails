import Image from "next/image"
import Link from "next/link"
import { cn } from "cn"
import { ClockIcon, SparklesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { fmtDuration } from "@/lib/dates"
import { formatPrice } from "@/lib/money"

export type ServiceCardData = {
  id?: string
  title: string
  description?: string | null
  durationMin: number
  bufferMin: number
  priceCents: number
  priceFrom?: boolean
  photoUrl?: string | null
}

/*
 * Card de serviço do Figma (M3 / D1 / pré-visualização em A3): foto (ou placeholder
 * "FOTO DO SERVIÇO"), título, descrição, duração + intervalo, preço em pink e botão Agendar.
 */
export function ServiceCard({
  service,
  href,
  className,
  ctaLabel = "Agendar",
}: {
  service: ServiceCardData
  href?: string
  className?: string
  ctaLabel?: string
}) {
  const cta = href ? (
    <Button asChild size="sm">
      <Link href={href}>{ctaLabel}</Link>
    </Button>
  ) : (
    <Button size="sm" type="button" tabIndex={-1} aria-hidden>
      {ctaLabel}
    </Button>
  )

  return (
    <article
      className={cn(
        "bg-surface border-subtle flex flex-col overflow-hidden rounded-md border",
        className,
      )}
    >
      <div className="bg-gradient-hero bg-surface-2 relative aspect-[16/9] w-full">
        {service.photoUrl ? (
          <Image
            src={service.photoUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 320px, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-pink-300/70">
            <SparklesIcon className="size-7" aria-hidden />
            <span className="type-caption">Foto do serviço</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-5">
        <h3 className="type-h3">{service.title}</h3>
        {service.description ? (
          <p className="type-body text-secondary-txt line-clamp-2">{service.description}</p>
        ) : null}
        <p className="type-body text-secondary-txt flex items-center gap-2">
          <ClockIcon className="size-4" aria-hidden />
          {fmtDuration(service.durationMin)}
          {service.bufferMin > 0 ? ` · +${service.bufferMin} min intervalo` : null}
        </p>
        <div className="mt-1 flex items-center justify-between">
          <span className="type-h2 text-pink-300">
            {formatPrice(service.priceCents, service.priceFrom)}
          </span>
          {cta}
        </div>
      </div>
    </article>
  )
}
