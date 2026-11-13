"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "cn"
import { CropIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { BackgroundKind } from "@/generated/prisma/enums"

import { setMediaFocusAction } from "../actions"

type Media = {
  id: string
  kind: BackgroundKind
  url: string
  posterUrl: string | null
  name: string
  focusX: number
  focusY: number
}

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)))

/*
 * Enquadramento de uma mídia: o fundo usa `object-fit: cover`, então em cada
 * tela sobra uma parte da foto fora da área visível. O ponto de interesse
 * (focusX/focusY, em %) diz qual região deve ficar sempre à mostra. A pessoa
 * arrasta o marcador sobre a mídia inteira e vê as prévias de desktop e
 * celular se ajustarem na hora.
 */
export function FramingDialog({ media }: { media: Media }) {
  const [open, setOpen] = React.useState(false)
  const [focus, setFocus] = React.useState({ x: media.focusX, y: media.focusY })
  const [pending, startTransition] = React.useTransition()
  const areaRef = React.useRef<HTMLDivElement>(null)
  /* proporção real da mídia: a caixa assume ela, sem faixas, para o % do marcador ser o % da imagem */
  const [ratio, setRatio] = React.useState(4 / 3)
  const dragging = React.useRef(false)

  const place = (e: React.PointerEvent) => {
    const el = areaRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setFocus({
      x: clamp(((e.clientX - r.left) / r.width) * 100),
      y: clamp(((e.clientY - r.top) / r.height) * 100),
    })
  }

  const save = () =>
    startTransition(async () => {
      const r = await setMediaFocusAction(media.id, focus.x, focus.y)
      if (r.error) {
        toast.error(r.error)
        return
      }
      toast.success(r.success)
      setOpen(false)
    })

  const position = `${focus.x}% ${focus.y}%`
  const dirty = focus.x !== media.focusX || focus.y !== media.focusY

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (pending) return
        setOpen(o)
        if (o) setFocus({ x: media.focusX, y: media.focusY })
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="soft"
          size="icon-xs"
          aria-label={`Enquadrar ${media.name}`}
          className="absolute top-2 right-11"
        >
          <CropIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Enquadramento · {media.name}</DialogTitle>
          <DialogDescription>
            Arraste o marcador para a parte da mídia que deve ficar sempre visível. As prévias
            mostram como o fundo corta no computador e no celular.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_200px]">
          {/* mídia inteira (contain) com o marcador */}
          <div
            ref={areaRef}
            className="bg-base relative mx-auto w-full cursor-crosshair touch-none overflow-hidden rounded-md select-none"
            style={{ aspectRatio: ratio, maxWidth: `calc(56vh * ${ratio})` }}
            onPointerDown={(e) => {
              dragging.current = true
              e.currentTarget.setPointerCapture(e.pointerId)
              place(e)
            }}
            onPointerMove={(e) => {
              if (dragging.current) place(e)
            }}
            onPointerUp={() => {
              dragging.current = false
            }}
            onPointerCancel={() => {
              dragging.current = false
            }}
          >
            <FullMedia media={media} onRatio={setRatio} />
            <span
              aria-hidden
              className="bg-magenta-500/60 pointer-events-none absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-pink-100 shadow-[0_0_0_2px_rgba(0,0,0,0.5)]"
              style={{ left: `${focus.x}%`, top: `${focus.y}%` }}
            />
          </div>

          {/* prévias com cover, como no fundo real */}
          <div className="flex flex-row gap-3 md:flex-col">
            <Preview
              label="Computador"
              className="aspect-[16/9] flex-1"
              media={media}
              position={position}
            />
            <Preview
              label="Celular"
              className="aspect-[9/16] w-[90px] md:w-[100px]"
              media={media}
              position={position}
            />
          </div>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <p className="type-caption text-secondary-txt">
            Ponto: {focus.x}% · {focus.y}%
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFocus({ x: 50, y: 28 })}
              disabled={pending}
            >
              Centralizar
            </Button>
            <Button type="button" onClick={save} disabled={pending || !dirty}>
              {pending ? "Salvando…" : "Salvar enquadramento"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* mídia inteira, sem corte: usa o pôster para vídeo quando existe */
function FullMedia({ media, onRatio }: { media: Media; onRatio: (r: number) => void }) {
  const src = media.kind === "VIDEO" ? media.posterUrl : media.url
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        fill
        sizes="720px"
        draggable={false}
        className="object-contain"
        onLoad={(e) => {
          const img = e.currentTarget
          if (img.naturalWidth && img.naturalHeight) onRatio(img.naturalWidth / img.naturalHeight)
        }}
      />
    )
  }
  return (
    <video
      src={media.url}
      muted
      playsInline
      preload="metadata"
      className="absolute inset-0 size-full object-contain"
      onLoadedMetadata={(e) => {
        const v = e.currentTarget
        if (v.videoWidth && v.videoHeight) onRatio(v.videoWidth / v.videoHeight)
      }}
    />
  )
}

function Preview({
  label,
  className,
  media,
  position,
}: {
  label: string
  className?: string
  media: Media
  position: string
}) {
  const src = media.kind === "VIDEO" ? media.posterUrl : media.url
  return (
    <figure className={cn("flex min-w-0 flex-col gap-1", className)}>
      <div className="bg-base border-subtle relative flex-1 overflow-hidden rounded-sm border">
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            sizes="200px"
            className="object-cover"
            style={{ objectPosition: position }}
          />
        ) : (
          <video
            src={media.url}
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: position }}
          />
        )}
      </div>
      <figcaption className="type-caption text-secondary-txt text-center">{label}</figcaption>
    </figure>
  )
}
