"use client"

import { useRef, useState, useTransition } from "react"
import Image from "next/image"
import { FilmIcon, Trash2Icon, UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BackgroundKind, BackgroundPage } from "@/generated/prisma/enums"

import {
  createBackgroundMediaAction,
  deleteBackgroundMediaAction,
  renameBackgroundMediaAction,
} from "../actions"
import { PAGE_LABELS } from "../pages"
import { type UploadMode, uploadBackgroundFile } from "../upload"
import { FramingDialog } from "./framing-dialog"

export type MediaTile = {
  id: string
  kind: BackgroundKind
  url: string
  posterUrl: string | null
  name: string
  pages: BackgroundPage[]
  focusX: number
  focusY: number
}

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp"
const VIDEO_ACCEPT = "video/mp4,video/webm"

function baseName(file: File) {
  return file.name.replace(/\.[^.]+$/, "").slice(0, 60) || "Mídia"
}

/*
 * Biblioteca de mídias de fundo (/admin/fundos): tile de envio de fotos,
 * diálogo de vídeo (arquivo + pôster) e grade com nome editável, telas em
 * que a mídia aparece e exclusão.
 */
export function MediaLibrary({
  media,
  uploadMode,
  pathPrefix,
}: {
  media: MediaTile[]
  uploadMode: UploadMode
  pathPrefix: string
}) {
  const [uploading, startUpload] = useTransition()

  function onPhotos(files: FileList | null) {
    if (!files?.length) return
    const list = Array.from(files)
    startUpload(async () => {
      let sent = 0
      for (const file of list) {
        try {
          const url = await uploadBackgroundFile(file, "image", uploadMode, pathPrefix)
          const r = await createBackgroundMediaAction({ kind: "IMAGE", url, name: baseName(file) })
          if (r.error) throw new Error(r.error)
          sent++
        } catch (e) {
          toast.error(`${file.name}: ${e instanceof Error ? e.message : "falha ao enviar"}`)
        }
      }
      if (sent > 0)
        toast.success(`${sent} foto${sent > 1 ? "s" : ""} adicionada${sent > 1 ? "s" : ""}.`)
    })
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="display-label text-pink-300">Biblioteca</p>
          <h2 className="type-h2 mt-1">Fotos e vídeos</h2>
          <p className="type-body text-secondary-txt mt-1">
            Envie uma vez e use em quantas telas quiser. Fotos até 5 MB; vídeos MP4 ou WebM até 50
            MB, de preferência curtos e sem áudio.
          </p>
        </div>
        <div className="flex gap-2">
          <VideoDialog uploadMode={uploadMode} pathPrefix={pathPrefix} />
          <Button asChild>
            <label htmlFor="bg-photo-input" className="cursor-pointer">
              <UploadIcon /> {uploading ? "Enviando…" : "Enviar fotos"}
            </label>
          </Button>
          <input
            id="bg-photo-input"
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              onPhotos(e.target.files)
              e.target.value = ""
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <label
          htmlFor="bg-photo-input"
          className="border-magenta-500/60 hover:bg-magenta-500/5 flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed text-center transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            onPhotos(e.dataTransfer.files)
          }}
        >
          <UploadIcon className="size-6 text-pink-300" aria-hidden />
          <span className="type-body-medium text-pink-300">
            {uploading ? "Enviando…" : "Enviar fotos"}
          </span>
          <span className="type-body text-secondary-txt">ou arraste aqui</span>
        </label>
        {media.map((m) => (
          <MediaCard key={m.id} media={m} />
        ))}
      </div>
    </section>
  )
}

function MediaCard({ media }: { media: MediaTile }) {
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(media.name)

  const saveName = () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === media.name) {
      setName(media.name)
      return
    }
    startTransition(async () => {
      const r = await renameBackgroundMediaAction(media.id, trimmed)
      if (r.error) {
        toast.error(r.error)
        setName(media.name)
      }
    })
  }

  const remove = () => {
    const inUse = media.pages.length > 0
    const ok = window.confirm(
      inUse
        ? `Excluir "${media.name}"? Ela sai de ${media.pages.length} tela${media.pages.length > 1 ? "s" : ""}.`
        : `Excluir "${media.name}"?`,
    )
    if (!ok) return
    startTransition(async () => {
      const r = await deleteBackgroundMediaAction(media.id)
      if (r.error) toast.error(r.error)
      else toast.success(r.success)
    })
  }

  return (
    <div
      className="bg-surface border-subtle flex flex-col overflow-hidden rounded-md border"
      data-pending={pending || undefined}
    >
      <div className="bg-surface-2 relative aspect-[4/3]">
        <MediaThumb
          media={media}
          sizes="(min-width: 1280px) 280px, (min-width: 640px) 33vw, 50vw"
        />
        {media.kind === "VIDEO" ? (
          <Badge variant="dark" className="absolute top-2 left-2">
            <FilmIcon aria-hidden /> Vídeo
          </Badge>
        ) : null}
        <FramingDialog media={media} />
        <Button
          type="button"
          variant="danger"
          size="icon-xs"
          aria-label={`Excluir ${media.name}`}
          className="absolute top-2 right-2"
          onClick={remove}
          disabled={pending}
        >
          <Trash2Icon />
        </Button>
      </div>
      <div className="flex flex-col gap-2 p-3">
        <Input
          aria-label="Nome da mídia"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur()
          }}
          maxLength={60}
          className="h-10 px-3"
        />
        <p className="type-caption text-secondary-txt truncate">
          {media.pages.length === 0
            ? "Em nenhuma tela"
            : media.pages.map((p) => PAGE_LABELS[p]).join(" · ")}
        </p>
      </div>
    </div>
  )
}

/* Miniatura: foto, ou vídeo com pôster (sem pôster, o próprio vídeo parado), já com o enquadramento. */
export function MediaThumb({
  media,
  sizes,
}: {
  media: Pick<MediaTile, "kind" | "url" | "posterUrl" | "focusX" | "focusY">
  sizes: string
}) {
  const src = media.kind === "VIDEO" ? media.posterUrl : media.url
  const style = { objectPosition: `${media.focusX}% ${media.focusY}%` }
  if (src) {
    return <Image src={src} alt="" fill sizes={sizes} className="object-cover" style={style} />
  }
  return (
    <video
      src={media.url}
      muted
      playsInline
      preload="metadata"
      className="absolute inset-0 size-full object-cover"
      style={style}
    />
  )
}

function VideoDialog({ uploadMode, pathPrefix }: { uploadMode: UploadMode; pathPrefix: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [pending, startTransition] = useTransition()
  const videoRef = useRef<HTMLInputElement>(null)
  const posterRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setName("")
    if (videoRef.current) videoRef.current.value = ""
    if (posterRef.current) posterRef.current.value = ""
  }

  const submit = () => {
    const video = videoRef.current?.files?.[0]
    const poster = posterRef.current?.files?.[0]
    if (!video) {
      toast.error("Escolha o arquivo de vídeo.")
      return
    }
    startTransition(async () => {
      try {
        const url = await uploadBackgroundFile(video, "video", uploadMode, pathPrefix)
        const posterUrl = poster
          ? await uploadBackgroundFile(poster, "image", uploadMode, pathPrefix)
          : undefined
        const r = await createBackgroundMediaAction({
          kind: "VIDEO",
          url,
          posterUrl,
          name: name.trim() || baseName(video),
        })
        if (r.error) throw new Error(r.error)
        toast.success(r.success)
        setOpen(false)
        reset()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao enviar o vídeo.")
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (pending) return
        setOpen(o)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary">
          <FilmIcon /> Enviar vídeo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Enviar vídeo</DialogTitle>
          <DialogDescription>
            MP4 ou WebM até 50 MB. O vídeo toca mudo, em loop. O pôster é a imagem mostrada enquanto
            carrega e em aparelhos com economia de dados.
          </DialogDescription>
        </DialogHeader>
        <form
          action={submit}
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="bg-video-file">Vídeo</Label>
            <Input
              id="bg-video-file"
              ref={videoRef}
              type="file"
              accept={VIDEO_ACCEPT}
              required
              className="h-12 py-3"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f && !name) setName(baseName(f))
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bg-video-poster">Pôster (opcional, recomendado)</Label>
            <Input
              id="bg-video-poster"
              ref={posterRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="h-12 py-3"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bg-video-name">Nome</Label>
            <Input
              id="bg-video-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bastidores do estúdio"
              maxLength={60}
              className="h-12"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enviando…" : "Adicionar vídeo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
