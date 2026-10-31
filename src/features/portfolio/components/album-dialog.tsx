"use client"

import { useState, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createAlbumAction } from "../actions"

export function NewAlbumDialog() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Novo álbum</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Novo álbum</DialogTitle>
          <DialogDescription>Álbuns viram filtros no portfólio da cliente.</DialogDescription>
        </DialogHeader>
        <form
          action={() =>
            startTransition(async () => {
              const r = await createAlbumAction(name)
              if (r.error) {
                toast.error(r.error)
                return
              }
              toast.success(r.success)
              setOpen(false)
              setName("")
              if (r.id) router.replace(`${pathname}?album=${r.id}`)
            })
          }
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="album-name">Nome</Label>
            <Input
              id="album-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nail art"
              className="h-12"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || name.trim().length < 2}>
              Criar álbum
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
