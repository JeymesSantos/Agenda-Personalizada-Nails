"use client"

import { useState } from "react"
import { CropIcon } from "lucide-react"
import { Button } from "./button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"
import { MediaFrameEditor } from "./media-frame-editor"
import { readFrame, type MediaFocus } from "@/lib/media-focus"

export function PhotoFramingDialog({
  url,
  value,
  onChange,
}: {
  url: string
  value?: MediaFocus
  onChange: (focus: MediaFocus) => void
}) {
  const initial = () => {
    const mobile = readFrame(value)
    return { mobile, desktop: readFrame(value?.desktop, mobile) }
  }
  const [open, setOpen] = useState(false)
  const [frames, setFrames] = useState(initial)
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setFrames(initial())
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
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>Enquadrar foto</DialogTitle>
          <DialogDescription>
            Ajuste a foto no formato do catálogo. Depois, salve o serviço para guardar a alteração.
          </DialogDescription>
        </DialogHeader>
        <MediaFrameEditor
          key={open ? "open" : "closed"}
          media={{ kind: "IMAGE", url }}
          value={frames}
          onChange={setFrames}
          variant="service"
        />
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => {
              onChange({ ...frames.mobile, desktop: frames.desktop })
              setOpen(false)
            }}
          >
            Aplicar enquadramento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
