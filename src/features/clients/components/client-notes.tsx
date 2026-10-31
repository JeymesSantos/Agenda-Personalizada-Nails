"use client"

import { useState, useTransition } from "react"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { fmt } from "@/lib/dates"
import { addClientNoteAction, deleteClientNoteAction } from "../actions"

export type NoteItem = { id: string; text: string; createdAt: Date }

/* Anotações da profissional sobre a cliente (só ela vê). */
export function ClientNotes({
  clientId,
  notes,
  timezone,
}: {
  clientId: string
  notes: NoteItem[]
  timezone: string
}) {
  const [text, setText] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-4">
      <form
        action={() =>
          startTransition(async () => {
            const r = await addClientNoteAction(clientId, text)
            if (r.error) {
              toast.error(r.error)
              return
            }
            toast.success(r.success)
            setText("")
          })
        }
        className="flex flex-col gap-2"
      >
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Formato amendoado, tom nude. Alergia a acetona."
          className="min-h-20"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={pending || text.trim().length < 2}>
            Adicionar anotação
          </Button>
        </div>
      </form>
      {notes.length === 0 ? (
        <p className="type-body text-secondary-txt">Nenhuma anotação ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((n) => (
            <li key={n.id} className="bg-surface-2 flex items-start gap-3 rounded-sm p-3.5">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="type-body whitespace-pre-wrap">{n.text}</p>
                <p className="type-caption text-muted-txt">
                  {fmt(n.createdAt, "d MMM yyyy", timezone)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Remover anotação"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await deleteClientNoteAction(n.id)
                    if (r.error) toast.error(r.error)
                    else toast.success(r.success)
                  })
                }
              >
                <Trash2Icon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
