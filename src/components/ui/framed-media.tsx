"use client"

import Image from "next/image"
import type { CSSProperties } from "react"
import type { ResponsiveFrames } from "@/lib/media-focus"

export type FrameMedia = { kind: "IMAGE" | "VIDEO"; url: string; posterUrl?: string | null }
export function FramedMedia({
  media,
  frames,
  sizes = "100vw",
  quality = 75,
  priority = false,
  playback = false,
  loop = false,
  posterOnly = false,
  onEnded,
  onDimensions,
  className = "",
}: {
  media: FrameMedia
  frames: ResponsiveFrames
  sizes?: string
  priority?: boolean
  playback?: boolean
  loop?: boolean
  posterOnly?: boolean
  onEnded?: () => void
  onDimensions?: (dimensions: { width: number; height: number }) => void
  className?: string
  quality?: 70 | 75
}) {
  const position = (frame: ResponsiveFrames["mobile"]) => `${frame.x}% ${frame.y}%`
  const style = {
    "--media-position": position(frames.mobile),
    "--desktop-media-position": position(frames.desktop),
    "--media-fit": frames.mobile.fit,
    "--desktop-media-fit": frames.desktop.fit,
    "--media-zoom": frames.mobile.zoom,
    "--desktop-media-zoom": frames.desktop.zoom,
  } as CSSProperties
  const classes = `framed-media absolute inset-0 size-full ${className}`
  if (media.kind === "VIDEO" && !posterOnly)
    return (
      <video
        src={media.url}
        poster={media.posterUrl ?? undefined}
        muted
        playsInline
        autoPlay={playback}
        loop={loop}
        preload={playback ? "auto" : "metadata"}
        onEnded={onEnded}
        onLoadedMetadata={(event) =>
          onDimensions?.({
            width: event.currentTarget.videoWidth,
            height: event.currentTarget.videoHeight,
          })
        }
        className={classes}
        style={style}
      />
    )
  const src = media.kind === "VIDEO" ? media.posterUrl : media.url
  if (!src) return null
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      priority={priority}
      quality={quality}
      draggable={false}
      className={classes}
      style={style}
      onLoad={(event) =>
        onDimensions?.({
          width: event.currentTarget.naturalWidth,
          height: event.currentTarget.naturalHeight,
        })
      }
    />
  )
}
