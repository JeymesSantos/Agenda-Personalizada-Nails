"use client"

import { useTransition } from "react"
import { CheckIcon, LockIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { deleteExceptionAction } from "../actions"

export type ExceptionItem = {
  id: string
  type: "BLOCK" | "RELEASE"
  title: string
  reason: string | null
}

/* "Bloqueios e exceções" (A4): cadeado para bloqueio, check verde para liberação, lixeira. */
export function ExceptionsList({ items }: { items: ExceptionItem[] }) {
  const [pending, startTransition] = useTransition()

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhum bloqueio futuro"
        description="Folgas, feriados e cursos aparecem aqui e somem da agenda da cliente."
        className="py-8"
      />
    )
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((e) => (
        <li key={e.id} className="bg-surface-2 flex items-center gap-3 rounded-sm p-3.5">
          <span
            className={
              e.type === "BLOCK"
                ? "text-muted-txt flex size-9 shrink-0 items-center justify-center rounded-sm [&_svg]:size-4"
                : "text-success bg-success/12 flex size-9 shrink-0 items-center justify-center rounded-sm [&_svg]:size-4"
            }
          >
            {e.type === "BLOCK" ? <LockIcon /> : <CheckIcon />}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="type-body-medium truncate">{e.title}</span>
            {e.reason ? (
              <span className="type-body text-secondary-txt truncate">{e.reason}</span>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Remover"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteExceptionAction(e.id)
                toast.success("Removido.")
              })
            }
          >
            <Trash2Icon />
          </Button>
        </li>
      ))}
    </ul>
  )
}
