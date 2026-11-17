"use client"

import { useRef, useState } from "react"
import { Button } from "./button"
import { FramedMedia, type FrameMedia } from "./framed-media"
import { DEFAULT_FRAME, dragFrame, type MediaFrame, type ResponsiveFrames } from "@/lib/media-focus"

export function MediaFrameEditor({
  media,
  value,
  onChange,
  disabled = false,
  variant = "background",
}: {
  media: FrameMedia
  value: ResponsiveFrames
  onChange: (frames: ResponsiveFrames) => void
  disabled?: boolean
  variant?: "background" | "service"
}) {
  const [target, setTarget] = useState<"desktop" | "mobile">("desktop")
  const [desktopRatio, setDesktopRatio] = useState("16:9")
  const [mobileRatio, setMobileRatio] = useState("9:16")
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const stage = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; frame: MediaFrame } | null>(null)
  const frame = value[target]
  const update = (next: MediaFrame) => onChange({ ...value, [target]: next })
  const ratioKey =
    variant === "service" ? "16:9" : target === "desktop" ? desktopRatio : mobileRatio
  const [w, h] = ratioKey.split(":").map(Number)
  const ratio = w / h
  const move = (dx: number, dy: number, initial = frame) => {
    if (!stage.current || disabled) return
    update(
      dragFrame(
        initial,
        { width: stage.current.clientWidth, height: stage.current.clientHeight },
        dimensions,
        dx,
        dy,
      ),
    )
  }
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" aria-label="Tela para enquadrar">
          <Button
            type="button"
            variant={target === "desktop" ? "primary" : "secondary"}
            aria-pressed={target === "desktop"}
            disabled={disabled}
            onClick={() => {
              drag.current = null
              setTarget("desktop")
            }}
          >
            Computador
          </Button>
          <Button
            type="button"
            variant={target === "mobile" ? "primary" : "secondary"}
            aria-pressed={target === "mobile"}
            disabled={disabled}
            onClick={() => {
              drag.current = null
              setTarget("mobile")
            }}
          >
            Celular
          </Button>
        </div>
        {variant === "background" ? (
          <label className="type-body flex items-center gap-2">
            Prévia
            <select
              aria-label="Formato da prévia"
              className="bg-surface-2 border-input h-10 rounded-sm border px-2"
              disabled={disabled}
              value={ratioKey}
              onChange={(event) =>
                target === "desktop"
                  ? setDesktopRatio(event.target.value)
                  : setMobileRatio(event.target.value)
              }
            >
              {target === "desktop" ? (
                <>
                  <option value="16:9">Monitor · 16:9</option>
                  <option value="16:10">Notebook · 16:10</option>
                  <option value="21:9">Ultrawide · 21:9</option>
                </>
              ) : (
                <>
                  <option value="9:16">Celular · 9:16</option>
                  <option value="9:19.5">Celular alto · 9:19,5</option>
                </>
              )}
            </select>
          </label>
        ) : (
          <span className="type-caption text-secondary-txt">Formato do cartão · 16:9</span>
        )}
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex min-w-0 flex-col items-center gap-2">
          <div
            ref={stage}
            tabIndex={disabled ? -1 : 0}
            role="group"
            aria-label="Prévia do enquadramento: arraste a imagem ou use as setas"
            data-testid="framing-stage"
            className="bg-base border-subtle relative mx-auto w-full touch-none overflow-hidden rounded-md border outline-none select-none focus-visible:ring-2 focus-visible:ring-pink-300"
            style={{
              aspectRatio: ratio,
              maxWidth: `min(100%, calc(46vh * ${ratio}))`,
              cursor: disabled ? "default" : "grab",
            }}
            onPointerDown={(event) => {
              if (disabled || event.button !== 0) return
              event.preventDefault()
              event.currentTarget.focus()
              event.currentTarget.setPointerCapture(event.pointerId)
              drag.current = { x: event.clientX, y: event.clientY, frame }
            }}
            onPointerMove={(event) => {
              if (drag.current)
                move(
                  event.clientX - drag.current.x,
                  event.clientY - drag.current.y,
                  drag.current.frame,
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
            onKeyDown={(event) => {
              const directions: Record<string, [number, number]> = {
                ArrowLeft: [-10, 0],
                ArrowRight: [10, 0],
                ArrowUp: [0, -10],
                ArrowDown: [0, 10],
              }
              const delta = directions[event.key]
              if (delta && !disabled) {
                event.preventDefault()
                move(delta[0], delta[1])
              }
            }}
          >
            <FramedMedia
              media={media}
              frames={{ mobile: frame, desktop: frame }}
              quality={variant === "background" ? 70 : 75}
              sizes="900px"
              onDimensions={setDimensions}
              className="pointer-events-none"
            />
          </div>
          <p className="type-caption text-secondary-txt text-center">
            Arraste a imagem para posicionar. Use as setas do teclado para ajustes finos.
          </p>
        </div>
        <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-4">
          <legend className="sr-only">Ajustes do enquadramento</legend>
          <div className="flex flex-col gap-2" aria-label="Como encaixar a imagem">
            <Button
              type="button"
              size="sm"
              variant={frame.fit === "cover" ? "soft" : "secondary"}
              aria-pressed={frame.fit === "cover"}
              onClick={() => update({ ...frame, fit: "cover" })}
            >
              Preencher área
            </Button>
            <Button
              type="button"
              size="sm"
              variant={frame.fit === "contain" ? "soft" : "secondary"}
              aria-pressed={frame.fit === "contain"}
              onClick={() => update({ ...frame, fit: "contain", zoom: 1 })}
            >
              Mostrar imagem inteira
            </Button>
          </div>
          <p className="type-body text-secondary-txt">
            {frame.fit === "cover"
              ? "Preenche a área e corta o que sobra nas bordas."
              : "Preserva a foto inteira; podem aparecer espaços ao redor."}
          </p>
          {(["x", "y"] as const).map((axis) => (
            <label key={axis} className="type-body flex flex-col gap-2">
              {axis === "x" ? "Horizontal" : "Vertical"}: {frame[axis]}%
              <input
                type="range"
                min="0"
                max="100"
                value={frame[axis]}
                onChange={(event) => update({ ...frame, [axis]: Number(event.target.value) })}
              />
            </label>
          ))}
          <label className="type-body flex flex-col gap-2">
            Zoom: {Math.round(frame.zoom * 100)}%
            <input
              type="range"
              min="100"
              max="300"
              step="5"
              value={Math.round(frame.zoom * 100)}
              disabled={disabled || frame.fit === "contain"}
              onChange={(event) => update({ ...frame, zoom: Number(event.target.value) / 100 })}
            />
          </label>
          {frame.zoom > 2 ? (
            <p className="type-caption text-warning">
              Zoom alto pode reduzir a nitidez. Confira a prévia antes de salvar.
            </p>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => update({ ...DEFAULT_FRAME })}
          >
            Restaurar enquadramento
          </Button>
          <p className="type-caption text-secondary-txt">
            O ajuste vale só para {target === "desktop" ? "computador" : "celular"}. O arquivo
            original é preservado.
          </p>
        </fieldset>
      </div>
    </div>
  )
}
