"use client"

import { useTransition } from "react"
import { upload } from "@vercel/blob/client"
import { PortfolioMedia } from "./portfolio-media"
import { registerVideoAction } from "../video-actions"
import { MAX_CLIP_BYTES } from "../video"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "cn"
import { UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { uploadPhotosAction } from "../actions"

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

  const select = (id: string) => {
    const sp = new URLSearchParams(params.toString())
    sp.set("foto", id)
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
  }

  function onFiles(files: FileList | null) {
    if (!files?.length) return
    const fd = new FormData()
    const picked = Array.from(files)
    if (uploading) return
    if (picked.length > 20) return void toast.error("Envie até 20 arquivos por vez.")
    for (const f of picked.filter((f) => !f.type.startsWith("video/"))) fd.append("files", f)
    if (albumId) fd.set("albumId", albumId)
    startUpload(async () => {
      try {
        let firstId: string | undefined
        for (const file of picked.filter((f) => f.type.startsWith("video/"))) {
          if (file.type !== "video/mp4" || file.size > MAX_CLIP_BYTES)
            throw new Error("Envie vídeos MP4 de até 15 segundos e 20 MB.")
          let url: string
          if (uploadMode === "blob") {
            const blob = await upload(`${pathPrefix}/${crypto.randomUUID()}.mp4`, file, {
              access: "public",
              contentType: "video/mp4",
              handleUploadUrl: "/api/uploads/portfolio",
            })
            url = blob.url
          } else {
            const body = new FormData()
            body.set("file", file)
            const res = await fetch("/api/uploads/portfolio", { method: "POST", body })
            const data = await res.json()
            if (!res.ok || !data.url) throw new Error(data.error ?? "Falha ao enviar vídeo.")
            url = data.url
          }
          const result = await registerVideoAction(url, albumId)
          if (result.error) throw new Error(result.error)
          firstId ??= result.id
        }
        if (fd.getAll("files").length) {
          const r = await uploadPhotosAction(fd)
          if (r.error) throw new Error(r.error)
          firstId ??= r.ids?.[0]
        }
        toast.success("Envio concluído.")
        if (firstId) select(firstId)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha no envio.")
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
        <span className="type-body text-secondary-txt">MP4 · até 15 s e 20 MB</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4"
          multiple
          className="sr-only"
          onChange={(e) => onFiles(e.target.files)}
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
