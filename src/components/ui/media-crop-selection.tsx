"use client"

import { useRef } from "react"
import { moveCrop, type MediaCrop } from "@/lib/media-focus"

const handles = [
  { key: "nw", label: "Canto superior esquerdo", left: "0%", top: "0%" },
  { key: "ne", label: "Canto superior direito", left: "100%", top: "0%" },
  { key: "sw", label: "Canto inferior esquerdo", left: "0%", top: "100%" },
  { key: "se", label: "Canto inferior direito", left: "100%", top: "100%" },
] as const

export function MediaCropSelection({
  value,
  onChange,
  disabled,
}: {
  value: MediaCrop
  onChange: (value: MediaCrop) => void
  disabled: boolean
}) {
  const root = useRef<HTMLDivElement>(null)
  const drag = useRef<{
    x: number
    y: number
    crop: MediaCrop
    handle: string
    width: number
    height: number
  } | null>(null)
  const keys = (key: string, handle: string, shift: boolean) => {
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }
    if (!delta[key] || disabled) return false
    onChange(
      moveCrop(value, handle, delta[key][0] * (shift ? 10 : 1), delta[key][1] * (shift ? 10 : 1)),
    )
    return true
  }
  return (
    <div
      ref={root}
      className="absolute inset-0"
      data-testid="crop-selection"
      onPointerDown={(event) => {
        if (disabled || event.button !== 0) return
        const handle = (event.target as HTMLElement).closest<HTMLElement>("[data-crop-handle]")
        if (!handle || !root.current) return
        event.preventDefault()
        event.stopPropagation()
        handle.focus()
        const bounds = root.current.getBoundingClientRect()
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = {
          x: event.clientX,
          y: event.clientY,
          crop: value,
          handle: handle.dataset.cropHandle!,
          width: bounds.width,
          height: bounds.height,
        }
      }}
      onPointerMove={(event) => {
        const start = drag.current
        if (start && !disabled)
          onChange(
            moveCrop(
              start.crop,
              start.handle,
              ((event.clientX - start.x) / start.width) * 100,
              ((event.clientY - start.y) / start.height) * 100,
            ),
          )
      }}
      onPointerUp={() => {
        drag.current = null
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
      onLostPointerCapture={() => {
        drag.current = null
      }}
    >
      <div
        style={{
          left: `${value.x}%`,
          top: `${value.y}%`,
          width: `${value.width}%`,
          height: `${value.height}%`,
          boxShadow: "0 0 0 9999px rgb(0 0 0 / 65%)",
        }}
        className="absolute border-2 border-white"
      >
        <button
          type="button"
          data-crop-handle="move"
          aria-label="Mover área de recorte"
          disabled={disabled}
          className="absolute inset-0 size-full cursor-move bg-transparent focus-visible:outline-2 focus-visible:outline-pink-300"
          onKeyDown={(event) => {
            if (keys(event.key, "move", event.shiftKey)) {
              event.preventDefault()
              event.stopPropagation()
            }
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3"
          aria-hidden
        >
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="border border-white/30" />
          ))}
        </div>
        {handles.map((handle) => (
          <button
            key={handle.key}
            type="button"
            data-crop-handle={handle.key}
            aria-label={handle.label}
            disabled={disabled}
            className="absolute size-8 rounded-sm border-2 border-pink-500 bg-white focus-visible:outline-2 focus-visible:outline-pink-300"
            style={{
              left: handle.left,
              top: handle.top,
              cursor: `${handle.key}-resize`,
              transform: `translate(${handle.key.includes("e") ? "-100%" : "0"}, ${handle.key.includes("s") ? "-100%" : "0"})`,
            }}
            onKeyDown={(event) => {
              if (keys(event.key, handle.key, event.shiftKey)) {
                event.preventDefault()
                event.stopPropagation()
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}
