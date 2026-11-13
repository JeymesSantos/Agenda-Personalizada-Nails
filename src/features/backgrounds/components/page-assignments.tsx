"use client"

import { useState, useTransition } from "react"
import { cn } from "cn"
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { BackgroundPage, BackgroundVeil } from "@/generated/prisma/enums"

import { setPageMediaAction, setPageVeilAction } from "../actions"
import { type BackgroundArea, VEIL_LABELS } from "../pages"
import { MediaThumb, type MediaTile } from "./media-library"

export type PageRow = {
  key: BackgroundPage
  area: BackgroundArea
  label: string
  isDefault: boolean
  /* mídias próprias da tela, na ordem; vazio = herda o padrão da área */
  mediaIds: string[]
  /* véu próprio; null = herda o do padrão da área */
  veil: BackgroundVeil | null
}

const VEILS: BackgroundVeil[] = ["LIGHT", "MEDIUM", "DENSE"]
const AREA_LABELS: Record<BackgroundArea, string> = {
  PUBLIC: "Área da cliente",
  ADMIN: "Painel",
}

/*
 * Qual mídia aparece em cada tela (/admin/fundos): por área, uma linha por
 * tela com o véu e a sequência de mídias. Tela sem mídia própria herda o
 * padrão da área; o padrão é a primeira linha de cada grupo.
 */
export function PageAssignments({ pages, library }: { pages: PageRow[]; library: MediaTile[] }) {
  const byId = new Map(library.map((m) => [m.id, m]))
  const areas: BackgroundArea[] = ["PUBLIC", "ADMIN"]

  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="display-label text-pink-300">Telas</p>
        <h2 className="type-h2 mt-1">O que aparece em cada tela</h2>
        <p className="type-body text-secondary-txt mt-1">
          Telas sem mídia própria usam o padrão da área. Com mais de uma mídia, elas passam em
          sequência; fotos ficam 7 s e vídeos tocam até o fim.
        </p>
      </div>
      {areas.map((area) => {
        const rows = pages.filter((p) => p.area === area)
        const def = rows.find((p) => p.isDefault)
        return (
          <div key={area} className="flex flex-col gap-3">
            <h3 className="type-h3">{AREA_LABELS[area]}</h3>
            <ul className="flex flex-col gap-3">
              {rows.map((row) => (
                <li key={row.key}>
                  <PageCard row={row} defaultRow={def ?? null} byId={byId} library={library} />
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
}

function PageCard({
  row,
  defaultRow,
  byId,
  library,
}: {
  row: PageRow
  defaultRow: PageRow | null
  byId: Map<string, MediaTile>
  library: MediaTile[]
}) {
  const [pending, startTransition] = useTransition()
  const [ids, setIds] = useState(row.mediaIds)
  const [pickerOpen, setPickerOpen] = useState(false)

  const inherits = !row.isDefault && ids.length === 0
  const shown = inherits ? (defaultRow?.mediaIds ?? []) : ids
  const effectiveVeil = row.veil ?? defaultRow?.veil ?? "MEDIUM"

  const save = (next: string[]) => {
    const prev = ids
    setIds(next)
    startTransition(async () => {
      const r = await setPageMediaAction(row.key, next)
      if (r.error) {
        toast.error(r.error)
        setIds(prev)
      }
    })
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= ids.length) return
    const next = [...ids]
    ;[next[i], next[j]] = [next[j], next[i]]
    save(next)
  }

  const setVeil = (veil: BackgroundVeil) =>
    startTransition(async () => {
      const r = await setPageVeilAction(row.key, veil)
      if (r.error) toast.error(r.error)
    })

  return (
    <div
      className={cn(
        "bg-surface border-subtle flex flex-col gap-4 rounded-md border p-4",
        pending && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="type-body-medium">{row.label}</span>
          {row.isDefault ? (
            <Badge variant="magenta">Padrão</Badge>
          ) : inherits ? (
            <Badge variant="neutral">Usa o padrão</Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="type-caption text-secondary-txt">Véu</span>
          <Select value={effectiveVeil} onValueChange={(v) => setVeil(v as BackgroundVeil)}>
            <SelectTrigger size="sm" className="w-[132px]" aria-label={`Véu de ${row.label}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VEILS.map((v) => (
                <SelectItem key={v} value={v}>
                  {VEIL_LABELS[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {shown.map((id, i) => {
          const m = byId.get(id)
          if (!m) return null
          return (
            <div
              key={id}
              className={cn(
                "bg-surface-2 border-subtle group relative aspect-[4/3] w-[120px] overflow-hidden rounded-sm border",
                inherits && "opacity-60",
              )}
              title={m.name}
            >
              <MediaThumb media={m} sizes="120px" />
              {!inherits ? (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 p-1">
                  <button
                    type="button"
                    aria-label={`Mover ${m.name} para trás`}
                    className="text-foreground disabled:opacity-30"
                    onClick={() => move(i, -1)}
                    disabled={i === 0 || pending}
                  >
                    <ChevronLeftIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remover ${m.name} de ${row.label}`}
                    className="text-foreground"
                    onClick={() => save(ids.filter((x) => x !== id))}
                    disabled={pending}
                  >
                    <XIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Mover ${m.name} para frente`}
                    className="text-foreground disabled:opacity-30"
                    onClick={() => move(i, 1)}
                    disabled={i === ids.length - 1 || pending}
                  >
                    <ChevronRightIcon className="size-4" />
                  </button>
                </div>
              ) : null}
            </div>
          )
        })}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setPickerOpen(true)}
          disabled={pending || library.length === 0}
        >
          <PlusIcon /> {inherits ? "Fundo próprio" : "Adicionar"}
        </Button>
        {!row.isDefault && !inherits ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => save([])}
            disabled={pending}
          >
            Voltar ao padrão
          </Button>
        ) : null}
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Adicionar a {row.label}</DialogTitle>
            <DialogDescription>Escolha uma mídia da biblioteca.</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
            {library
              .filter((m) => !ids.includes(m.id))
              .map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="bg-surface-2 border-subtle hover:border-magenta-500 relative aspect-[4/3] overflow-hidden rounded-sm border text-left transition-colors"
                  onClick={() => {
                    save([...ids, m.id])
                    setPickerOpen(false)
                  }}
                >
                  <MediaThumb media={m} sizes="200px" />
                  <span className="type-caption absolute inset-x-0 bottom-0 truncate bg-black/55 px-2 py-1">
                    {m.name}
                  </span>
                </button>
              ))}
            {library.filter((m) => !ids.includes(m.id)).length === 0 ? (
              <p className="type-body text-secondary-txt col-span-full py-6 text-center">
                Todas as mídias já estão nesta tela.
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
