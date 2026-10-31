"use client"

import { useTransition } from "react"
import Image from "next/image"
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
}: {
  photos: PhotoTile[]
  albumId: string | null
  selectedId: string | null
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
    for (const f of Array.from(files)) fd.append("files", f)
    if (albumId) fd.set("albumId", albumId)
    startUpload(async () => {
      const r = await uploadPhotosAction(fd)
      if (r.error) {
        toast.error(r.error)
        return
      }
      toast.success(r.success)
      if (r.ids?.[0]) select(r.ids[0])
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
          {uploading ? "Enviando…" : "Enviar fotos"}
        </span>
        <span className="type-body text-secondary-txt">ou arraste aqui</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
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
            <Image
              src={p.url}
              alt={p.caption ?? ""}
              fill
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
