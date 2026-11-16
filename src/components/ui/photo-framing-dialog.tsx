"use client"

import { useState } from "react"
import Image from "next/image"
import { CropIcon } from "lucide-react"
import { Button } from "./button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"
import type { MediaFocus } from "@/lib/media-focus"

export function PhotoFramingDialog({
  url,
  value,
  onChange,
}: {
  url: string
  value?: MediaFocus
  onChange: (focus: MediaFocus) => void
}) {
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState(value ?? { x: 50, y: 50 })
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setFocus(value ?? { x: 50, y: 50 })
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="soft"
          size="icon-xs"
          className="absolute top-2 left-2"
          aria-label="Ajustar enquadramento da foto"
        >
          <CropIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enquadrar foto</DialogTitle>
          <DialogDescription>
            Ajuste a posição da foto no catálogo. Depois, salve o serviço para guardar a alteração.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-base relative aspect-video overflow-hidden rounded-md">
          <Image
            src={url}
            alt="Prévia do enquadramento"
            fill
            sizes="500px"
            className="object-cover"
            style={{ objectPosition: `${focus.x}% ${focus.y}%` }}
          />
        </div>
        {(["x", "y"] as const).map((axis) => (
          <label key={axis} className="type-body flex flex-col gap-2">
            {axis === "x" ? "Horizontal" : "Vertical"}: {focus[axis]}%
            <input
              type="range"
              min="0"
              max="100"
              value={focus[axis]}
              onChange={(e) => setFocus({ ...focus, [axis]: Number(e.target.value) })}
            />
          </label>
        ))}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setFocus({ x: 50, y: 50 })}>
            Centralizar
          </Button>
          <Button
            type="button"
            onClick={() => {
              onChange(focus)
              setOpen(false)
            }}
          >
            Aplicar enquadramento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
