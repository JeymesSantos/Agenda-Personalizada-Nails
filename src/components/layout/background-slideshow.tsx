"use client"

import * as React from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "cn"

import type { AreaBackgrounds, BackgroundItem } from "@/features/backgrounds/queries"
import { resolveBackgroundPage } from "@/features/backgrounds/pages"
import type { BackgroundVeil } from "@/generated/prisma/enums"
import { useMediaQuery } from "@/lib/use-media-query"

/* tempos de exibição: foto fixa; vídeo toca até o fim, com teto */
const IMAGE_MS = 7_000
const VIDEO_MAX_MS = 20_000
const FADE_MS = 1_500

/*
 * Fotos e vídeos fixos ao fundo de um layout inteiro, escolhidos pela rota atual
 * (ver features/backgrounds/pages). Crossfade com leve zoom; vídeo toca mudo.
 * Só decoração: fica atrás do conteúdo (-z-10 dentro de um pai `isolate`) e é
 * ignorado por leitores de tela.
 *
 * Com "reduzir movimento" ou economia de dados ativa, mostra só a primeira
 * mídia parada (o pôster, no caso de vídeo).
 */
export function BackgroundSlideshow({
  data,
  className,
}: {
  data: AreaBackgrounds
  className?: string
}) {
  const pathname = usePathname()
  const pageKey = resolveBackgroundPage(pathname, data.area)
  const page = data.pages[pageKey]
  if (!page || page.items.length === 0) return null
  /* trocar de tela reinicia o slideshow do zero */
  return <Slides key={pageKey} items={page.items} veil={page.veil} className={className} />
}

function useSaveData(): boolean {
  return React.useSyncExternalStore(
    () => () => {},
    () => {
      const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
      return Boolean(nav.connection?.saveData)
    },
    () => false,
  )
}

function Slides({
  items,
  veil,
  className,
}: {
  items: BackgroundItem[]
  veil: BackgroundVeil
  className?: string
}) {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const saveData = useSaveData()
  const still = reduceMotion || saveData

  const [current, setCurrent] = React.useState(0)
  const [previous, setPrevious] = React.useState<number | null>(null)
  const n = items.length
  const animate = !still && n > 1

  const advance = React.useCallback(() => {
    setCurrent((i) => {
      setPrevious(i)
      return (i + 1) % n
    })
  }, [n])

  /* some com o slide anterior depois do crossfade */
  React.useEffect(() => {
    if (previous === null) return
    const t = window.setTimeout(() => setPrevious(null), FADE_MS)
    return () => window.clearTimeout(t)
  }, [previous])

  /* foto: tempo fixo; vídeo: até o fim ou o teto (o `onEnded` do vídeo também avança) */
  React.useEffect(() => {
    if (!animate) return
    const ms = items[current].kind === "VIDEO" ? VIDEO_MAX_MS : IMAGE_MS
    const t = window.setTimeout(advance, ms)
    return () => window.clearTimeout(t)
  }, [animate, current, items, advance])

  return (
    <div
      aria-hidden
      data-veil={veil}
      className={cn(
        "bg-slideshow pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        still && "bg-slideshow-still",
        className,
      )}
    >
      {items.map((item, i) => {
        const isCurrent = i === current
        const isPrevious = i === previous
        if (!isCurrent && !isPrevious) return null
        return (
          <div
            key={item.id}
            className="bg-slide absolute inset-0"
            data-state={isCurrent ? "in" : "out"}
            style={{ zIndex: isCurrent ? 1 : 0 }}
          >
            <Slide
              item={item}
              active={isCurrent}
              still={still}
              loop={n === 1}
              onEnded={animate && isCurrent ? advance : undefined}
              priority={i === 0}
            />
          </div>
        )
      })}
      <div className="bg-slideshow-fade absolute inset-0 z-[2]" />
    </div>
  )
}

function Slide({
  item,
  active,
  still,
  loop,
  onEnded,
  priority,
}: {
  item: BackgroundItem
  active: boolean
  still: boolean
  loop: boolean
  onEnded?: () => void
  priority: boolean
}) {
  /* enquadramento definido em /admin/fundos; `object-cover` mantém a proporção em qualquer janela */
  const style = { objectPosition: `${item.focusX}% ${item.focusY}%` }
  const media = "absolute inset-0 size-full object-cover"
  if (item.kind === "VIDEO" && !still) {
    return (
      <video
        src={item.url}
        poster={item.posterUrl ?? undefined}
        autoPlay
        muted
        playsInline
        loop={loop}
        preload={active ? "auto" : "metadata"}
        onEnded={onEnded}
        className={media}
        style={style}
      />
    )
  }
  const src = item.kind === "VIDEO" ? item.posterUrl : item.url
  if (!src) return null
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes="100vw"
      priority={priority}
      quality={70}
      className={media}
      style={style}
    />
  )
}
