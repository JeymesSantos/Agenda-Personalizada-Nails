"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { cropWindow, FULL_CROP, type ResponsiveFrames } from "@/lib/media-focus"

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
  const box = useRef<HTMLDivElement>(null)
  const [area, setArea] = useState({ width: 0, height: 0 })
  const [source, setSource] = useState({ width: 0, height: 0 })
  const cropped = Boolean(frames.mobile.crop || frames.desktop.crop)
  useEffect(() => {
    if (!cropped || !box.current) return
    const observer = new ResizeObserver(([entry]) =>
      setArea({ width: entry.contentRect.width, height: entry.contentRect.height }),
    )
    observer.observe(box.current)
    return () => observer.disconnect()
  }, [cropped])
  const dimensions = (next: { width: number; height: number }) => {
    if (cropped) setSource(next)
    onDimensions?.(next)
  }
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
  const cropStyle = {} as Record<string, string>
  for (const target of ["mobile", "desktop"] as const) {
    const prefix = target === "desktop" ? "--desktop-crop" : "--crop"
    const frame = frames[target],
      crop = frame.crop ?? FULL_CROP
    const window = cropWindow(frame, area, source)
    for (const [key, value] of Object.entries(window)) cropStyle[`${prefix}-${key}`] = `${value}%`
    cropStyle[`${prefix}-source-width`] = `${10000 / crop.width}%`
    cropStyle[`${prefix}-source-height`] = `${10000 / crop.height}%`
    cropStyle[`${prefix}-source-left`] = `${(-crop.x / crop.width) * 100}%`
    cropStyle[`${prefix}-source-top`] = `${(-crop.y / crop.height) * 100}%`
  }
  const sourceStyle = cropped
    ? ({
        width: "var(--crop-source-width)",
        height: "var(--crop-source-height)",
        left: "var(--crop-source-left)",
        top: "var(--crop-source-top)",
        right: "auto",
        bottom: "auto",
        objectFit: "fill",
        maxWidth: "none",
      } as CSSProperties)
    : style
  const wrap = (element: ReactNode) =>
    cropped ? (
      <div ref={box} className={classes} style={{ ...style, ...cropStyle }} data-cropped="true">
        <div className="framed-crop-window">{element}</div>
      </div>
    ) : (
      element
    )
  if (media.kind === "VIDEO" && !posterOnly)
    return wrap(
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
          dimensions({
            width: event.currentTarget.videoWidth,
            height: event.currentTarget.videoHeight,
          })
        }
        className={cropped ? "absolute" : classes}
        style={sourceStyle}
      />,
    )
  const src = media.kind === "VIDEO" ? media.posterUrl : media.url
  if (!src) return null
  return wrap(
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      priority={priority}
      quality={quality}
      draggable={false}
      className={cropped ? "absolute" : classes}
      style={sourceStyle}
      onLoad={(event) =>
        dimensions({
          width: event.currentTarget.naturalWidth,
          height: event.currentTarget.naturalHeight,
        })
      }
    />,
  )
}
