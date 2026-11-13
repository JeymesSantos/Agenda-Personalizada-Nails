"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "cn"

import { useMediaQuery } from "@/lib/use-media-query"

export type FeaturedPhoto = { id: string; url: string; caption: string | null }

/* cada quadro troca a cada ~6 s; os quadros ficam defasados para não trocarem juntos */
const INTERVAL_MS = 6_000
const STAGGER_MS = 1_400
const FADE_MS = 900

/*
 * Quadro dos destaques do portfólio (M1/D1) que passa por mais fotos do que
 * cabem na grade. O quadro `slot` de `slots` mostra a foto `slot` e avança de
 * `slots` em `slots`, então os quadros nunca repetem a mesma foto ao mesmo
 * tempo. Crossfade entre a foto atual e a anterior; com "reduzir movimento"
 * ou quando há foto só para um ciclo, fica parado.
 */
export function RotatingPhotoTile({
  photos,
  slot,
  slots,
  className,
  sizes,
  linkToPortfolio = false,
}: {
  photos: FeaturedPhoto[]
  slot: number
  slots: number
  className?: string
  sizes: string
  linkToPortfolio?: boolean
}) {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const n = photos.length
  const [index, setIndex] = React.useState(slot % n)
  const [previous, setPrevious] = React.useState<number | null>(null)
  const rotates = !reduceMotion && n > slots

  React.useEffect(() => {
    if (!rotates) return
    let interval: number | undefined
    const start = window.setTimeout(
      () => {
        const tick = () =>
          setIndex((i) => {
            setPrevious(i)
            return (i + slots) % n
          })
        tick()
        interval = window.setInterval(tick, INTERVAL_MS)
      },
      INTERVAL_MS + slot * STAGGER_MS,
    )
    return () => {
      window.clearTimeout(start)
      if (interval) window.clearInterval(interval)
    }
  }, [rotates, slot, slots, n])

  React.useEffect(() => {
    if (previous === null) return
    const t = window.setTimeout(() => setPrevious(null), FADE_MS)
    return () => window.clearTimeout(t)
  }, [previous])

  const current = photos[index]
  if (!current) return null

  const tile = (
    <div className={cn("bg-surface-2 relative overflow-hidden rounded-md", className)}>
      {photos.map((p, i) => {
        const isCurrent = i === index
        const isPrevious = i === previous
        if (!isCurrent && !isPrevious) return null
        return (
          <Image
            key={p.id}
            src={p.url}
            alt=""
            fill
            sizes={sizes}
            className={cn(
              "object-cover transition-opacity duration-[900ms] ease-in-out",
              isCurrent ? "z-[1] opacity-100" : "z-0 opacity-0",
            )}
          />
        )
      })}
    </div>
  )

  if (!linkToPortfolio) return tile
  return (
    <Link
      href={`/portfolio?foto=${current.id}`}
      aria-label={current.caption ? `Ver foto: ${current.caption}` : "Ver foto do portfólio"}
    >
      {tile}
    </Link>
  )
}
