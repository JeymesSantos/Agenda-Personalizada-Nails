"use client"

import { useState, useTransition } from "react"
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
import { MediaFrameEditor } from "@/components/ui/media-frame-editor"
import { backgroundFraming } from "@/lib/media-focus"
import type { MediaTile } from "./media-library"
import { setMediaFocusAction } from "../actions"

export function FramingDialog({ media }: { media: MediaTile }) {
  const initial = backgroundFraming(media)
  const [open, setOpen] = useState(false)
  const [frames, setFrames] = useState(initial)
  const [pending, startTransition] = useTransition()
  const dirty = JSON.stringify(frames) !== JSON.stringify(initial)
  const save = () =>
    startTransition(async () => {
      const result = await setMediaFocusAction(
        media.id,
        frames.mobile.x,
        frames.mobile.y,
        frames.desktop.x,
        frames.desktop.y,
        frames,
      )
      if (result.error) return void toast.error(result.error)
      toast.success(result.success)
      setOpen(false)
    })
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        setOpen(next)
        if (next) setFrames(initial)
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
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>Enquadramento · {media.name}</DialogTitle>
          <DialogDescription>
            Arraste a mídia na prévia e ajuste o zoom. Confira os formatos de tela antes de salvar.
          </DialogDescription>
        </DialogHeader>
        <MediaFrameEditor
          key={open ? "open" : "closed"}
          media={media}
          value={frames}
          onChange={setFrames}
          disabled={pending}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button type="button" disabled={pending || !dirty} onClick={save}>
            {pending ? "Salvando…" : "Salvar enquadramento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
