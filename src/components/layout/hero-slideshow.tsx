import type * as React from "react"
import Image from "next/image"
import { cn } from "cn"

/* Fotos da área pública (public/hero) e do painel (public/hero-admin). */
export const PUBLIC_HERO_SLIDES = [
  "/hero/hero-1.jpg",
  "/hero/hero-2.jpg",
  "/hero/hero-3.jpg",
  "/hero/hero-4.jpg",
  "/hero/hero-5.jpg",
]

export const ADMIN_HERO_SLIDES = [
  "/hero-admin/admin-1.jpg",
  "/hero-admin/admin-2.jpg",
  "/hero-admin/admin-3.jpg",
]

/* cada foto fica ~7s na tela; o ciclo cresce com a quantidade de fotos */
const SECONDS_PER_SLIDE = 7

/*
 * Fotos fixas ao fundo de um layout inteiro: crossfade lento com leve zoom,
 * sob um véu escuro + gradiente magenta. Só decoração: fica atrás do conteúdo
 * (position: fixed, -z-10 dentro de um pai `isolate`) e é ignorado por leitores de tela.
 * Com "reduzir movimento" mostra só a primeira foto, parada.
 *
 * `slides` precisa ter 3 ou 5 fotos (keyframes em globals.css). `tone="dense"`
 * usa um véu mais fechado, para telas cheias de tabelas e formulários (painel).
 */
export function HeroSlideshow({
  slides,
  tone = "default",
  className,
}: {
  slides: string[]
  tone?: "default" | "dense"
  className?: string
}) {
  const n = slides.length
  return (
    <div
      aria-hidden
      data-count={n}
      data-tone={tone}
      className={cn("hero-slideshow -z-10", className)}
      style={{ "--hero-cycle": `${n * SECONDS_PER_SLIDE}s` } as React.CSSProperties}
    >
      {slides.map((src, i) => (
        <div
          key={src}
          className="hero-slide"
          style={
            {
              /* -i/n escalona as fotos; -5% pula o fade-in da primeira */
              "--hero-slide-delay": `calc(var(--hero-cycle) * ${-(i / n) - 0.05})`,
            } as React.CSSProperties
          }
        >
          <Image src={src} alt="" fill sizes="100vw" priority={i === 0} quality={70} />
        </div>
      ))}
      <div className="hero-slideshow-fade" />
    </div>
  )
}
