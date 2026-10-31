"use client"

import { useTransition } from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { deleteExpenseAction } from "../actions"
import { ExpenseDialog, type ExpenseEdit } from "./expense-dialog"

export function ExpenseRowActions({
  expense,
  categories,
  todayYmd,
}: {
  expense: ExpenseEdit
  categories: string[]
  todayYmd: string
}) {
  const [pending, startTransition] = useTransition()
  return (
    <div className="flex items-center justify-end gap-1">
      <ExpenseDialog
        categories={categories}
        todayYmd={todayYmd}
        edit={expense}
        trigger={
          <Button variant="ghost" size="icon-xs" aria-label="Editar">
            <PencilIcon />
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Excluir"
        disabled={pending}
        onClick={() => {
          if (!confirm("Excluir esta despesa?")) return
          startTransition(async () => {
            const r = await deleteExpenseAction(expense.id)
            if (r.error) toast.error(r.error)
            else toast.success(r.success)
          })
        }}
      >
        <Trash2Icon />
      </Button>
    </div>
  )
}
