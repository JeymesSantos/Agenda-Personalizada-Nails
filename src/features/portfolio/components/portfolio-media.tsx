"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useMediaQuery } from "@/lib/use-media-query"
import { isPortfolioVideo } from "../video"

export function PortfolioMedia({
  src,
  alt,
  sizes,
  className,
  priority = false,
}: {
  src: string
  alt: string
  sizes: string
  className?: string
  priority?: boolean
}) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", true)
  const ref = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const video = ref.current
    if (!video) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reducedMotion) void video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.2 },
    )
    observer.observe(video)
    return () => {
      observer.disconnect()
      video.pause()
    }
  }, [src, reducedMotion])
  if (!isPortfolioVideo(src))
    return (
      <Image src={src} alt={alt} fill sizes={sizes} className={className} priority={priority} />
    )
  return (
    <>
      <video
        ref={ref}
        src={`${src}#t=0.001`}
        aria-label={alt || "Vídeo do portfólio"}
        muted
        loop
        playsInline
        preload="metadata"
        controls={reducedMotion}
        onError={() => setFailed(true)}
        className={`absolute inset-0 size-full object-cover ${className ?? ""}`}
      />
      {failed ? (
        <span className="bg-surface-2 absolute inset-0 flex items-center justify-center p-4 text-center text-sm">
          Vídeo indisponível no momento.
        </span>
      ) : (
        <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
          Vídeo · loop
        </span>
      )}
    </>
  )
}
