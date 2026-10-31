"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ImageIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { deletePhotoAction, setCoverAction, updatePhotoAction } from "../actions"

export type PhotoDetail = {
  id: string
  url: string
  caption: string | null
  serviceId: string | null
  albumId: string | null
  isCover: boolean
  featuredOnBio: boolean
  wantThis: boolean
}

const selectClass =
  "type-body-l bg-surface-2 border-input h-12 w-full rounded-md border px-4 text-foreground outline-none focus-visible:border-ring"

/* Painel "Foto selecionada" (A6): legenda, serviço vinculado, álbum, destaque na bio, botão Quero esse. */
export function PhotoPanel({
  photo,
  services,
  albums,
}: {
  photo: PhotoDetail
  services: { id: string; title: string }[]
  albums: { id: string; name: string }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [featured, setFeatured] = useState(photo.featuredOnBio)
  const [wantThis, setWantThis] = useState(photo.wantThis)

  const run = (fn: () => Promise<{ error?: string; success?: string }>, after?: () => void) =>
    startTransition(async () => {
      const r = await fn()
      if (r.error) {
        toast.error(r.error)
        return
      }
      if (r.success) toast.success(r.success)
      after?.()
    })

  const close = () => {
    const sp = new URLSearchParams(params.toString())
    sp.delete("foto")
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
  }

  return (
    <form
      key={photo.id}
      action={(fd) => run(() => updatePhotoAction(photo.id, fd))}
      className="flex flex-col gap-4"
    >
      <h2 className="type-h3">Foto selecionada</h2>
      <div className="bg-surface-2 relative aspect-[4/3] w-full overflow-hidden rounded-md">
        <Image
          src={photo.url}
          alt={photo.caption ?? ""}
          fill
          sizes="340px"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="caption">Legenda</Label>
        <Input
          id="caption"
          name="caption"
          defaultValue={photo.caption ?? ""}
          placeholder="Francesinha rosé com glitter"
          className="h-12"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="serviceId">Vincular ao serviço</Label>
        <select
          id="serviceId"
          name="serviceId"
          defaultValue={photo.serviceId ?? ""}
          className={selectClass}
        >
          <option value="">Nenhum</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="albumId">Álbum</Label>
        <select
          id="albumId"
          name="albumId"
          defaultValue={photo.albumId ?? ""}
          className={selectClass}
        >
          <option value="">Sem álbum</option>
          {albums.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center justify-between gap-4 py-1">
        <span className="flex flex-col">
          <span className="type-body-medium">Destaque na bio</span>
          <span className="type-body text-secondary-txt">Aparece na página inicial</span>
        </span>
        <Switch name="featuredOnBio" checked={featured} onCheckedChange={setFeatured} />
      </label>
      <label className="flex items-center justify-between gap-4 py-1">
        <span className="flex flex-col">
          <span className="type-body-medium">Botão &ldquo;Quero esse&rdquo;</span>
          <span className="type-body text-secondary-txt">Leva a cliente direto ao serviço</span>
        </span>
        <Switch name="wantThis" checked={wantThis} onCheckedChange={setWantThis} />
      </label>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar"}
      </Button>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={pending || photo.isCover}
          onClick={() => run(() => setCoverAction(photo.id))}
        >
          <ImageIcon /> {photo.isCover ? "É a capa" : "Definir capa"}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={pending}
          onClick={() => {
            if (!confirm("Excluir esta foto?")) return
            run(() => deletePhotoAction(photo.id), close)
          }}
        >
          <Trash2Icon /> Excluir
        </Button>
      </div>
    </form>
  )
}
