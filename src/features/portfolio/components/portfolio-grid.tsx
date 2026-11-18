"use client"

import { useRef, useTransition } from "react"
import { PortfolioMedia } from "./portfolio-media"
import { registerVideoAction } from "../video-actions"
import { MAX_CLIP_BYTES } from "../video"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "cn"
import { UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { registerPortfolioPhotoAction } from "../actions"
import { uploadPortfolioFile } from "../upload"
import { validatePortfolioFiles } from "../upload-validation"

export type PhotoTile = {
  id: string
  url: string
  caption: string | null
  isCover: boolean
  featuredOnBio: boolean
}

/* Grade do editor de portfólio (A6): tile de envio + fotos com etiquetas CAPA / DESTAQUE NA BIO. */
export function PortfolioGrid({
  photos,
  albumId,
  selectedId,
  uploadMode,
  pathPrefix,
}: {
  photos: PhotoTile[]
  albumId: string | null
  selectedId: string | null
  uploadMode: "local" | "blob"
  pathPrefix: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [uploading, startUpload] = useTransition()
  const uploadInProgress = useRef(false)

  const select = (id: string) => {
    const sp = new URLSearchParams(params.toString())
    sp.set("foto", id)
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
  }

  function onFiles(files: FileList | null) {
    if (!files?.length || uploadInProgress.current) return
    const batch = Array.from(files)
    if (batch.length > 20) return void toast.error("Envie até 20 arquivos por vez.")
    const photos = batch.filter((file) => !file.type.startsWith("video/"))
    const error = photos.length ? validatePortfolioFiles(photos) : null
    if (error) {
      toast.error(error)
      return
    }
    if (
      batch.some(
        (file) =>
          file.type.startsWith("video/") &&
          (file.type !== "video/mp4" || !file.size || file.size > MAX_CLIP_BYTES),
      )
    ) {
      toast.error("Envie vídeos MP4 de até 15 segundos e 20 MB.")
      return
    }
    uploadInProgress.current = true
    startUpload(async () => {
      let saved = 0
      let firstId: string | undefined
      try {
        for (const file of batch) {
          const url = await uploadPortfolioFile(file, uploadMode, pathPrefix)
          const result =
            file.type === "video/mp4"
              ? await registerVideoAction(url, albumId)
              : await registerPortfolioPhotoAction({ url, albumId })
          if (result.error) throw new Error(result.error)
          saved++
          firstId ??= result.id
        }
        toast.success(`${saved} arquivo${saved > 1 ? "s" : ""} enviado${saved > 1 ? "s" : ""}.`)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Não foi possível enviar os arquivos."
        toast.error(saved ? `${saved} arquivo(s) salvo(s). ${message}` : message)
      } finally {
        uploadInProgress.current = false
        if (firstId) select(firstId)
        router.refresh()
      }
    })
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      <label
        className="border-magenta-500/60 hover:bg-magenta-500/5 flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed text-center transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          onFiles(e.dataTransfer.files)
        }}
      >
        <UploadIcon className="size-6 text-pink-300" aria-hidden />
        <span className="type-body-medium text-pink-300">
          {uploading ? "Enviando…" : "Enviar fotos ou vídeos"}
        </span>
        <span className="type-body text-secondary-txt">ou arraste aqui</span>
        <span className="type-caption text-secondary-txt">
          Até 20 arquivos · JPG, PNG ou WebP · 5 MB por foto · MP4 até 15 s e 20 MB
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4"
          multiple
          className="sr-only"
          onChange={(e) => {
            onFiles(e.target.files)
            e.target.value = ""
          }}
          disabled={uploading}
          id="portfolio-upload-proxy"
          data-testid="portfolio-upload"
        />
      </label>

      {photos.map((p) => {
        const selected = p.id === selectedId
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => select(p.id)}
            aria-pressed={selected}
            className={cn(
              "group focus-visible:ring-ring/50 relative aspect-square overflow-hidden rounded-md border-2 border-transparent transition-all focus-visible:ring-3",
              selected && "glow-primary border-pink-300",
            )}
          >
            <PortfolioMedia
              src={p.url}
              alt={p.caption ?? ""}
              sizes="(min-width: 1280px) 220px, 50vw"
              className="object-cover"
            />
            <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
              {p.isCover ? <Badge variant="dark">Capa</Badge> : null}
              {p.featuredOnBio ? <Badge variant="dark">Destaque na bio</Badge> : null}
            </div>
          </button>
        )
      })}
    </div>
  )
}
