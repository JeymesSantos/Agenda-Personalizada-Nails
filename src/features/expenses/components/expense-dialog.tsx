"use client"

import { useActionState, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PaperclipIcon, PlusIcon, XIcon } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCentsExact } from "@/lib/money"
import { saveExpenseAction, uploadReceiptAction } from "../actions"
import { DEFAULT_CATEGORIES, type ExpenseFormState } from "../schemas"

export type ExpenseEdit = {
  id: string
  description: string
  amountCents: number
  dateYmd: string
  category: string
  type: "FIXED" | "VARIABLE"
  recurring: boolean
  receiptUrl: string | null
}

/* Modal "Lançar despesa" (A5): descrição, valor, data, categoria, fixa/variável, recorrência, comprovante. */
export function ExpenseDialog({
  categories,
  todayYmd,
  defaultOpen = false,
  edit,
  trigger,
}: {
  categories: string[]
  todayYmd: string
  defaultOpen?: boolean
  edit?: ExpenseEdit
  trigger?: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [open, setOpen] = useState(defaultOpen)
  const [type, setType] = useState<"FIXED" | "VARIABLE">(edit?.type ?? "VARIABLE")
  const [recurring, setRecurring] = useState(edit?.recurring ?? false)
  const [receiptUrl, setReceiptUrl] = useState(edit?.receiptUrl ?? "")
  const [uploading, startUpload] = useTransition()
  const [category, setCategory] = useState(edit?.category ?? "")
  const [newCategory, setNewCategory] = useState(false)
  const allCategories = Array.from(new Set([...categories, ...DEFAULT_CATEGORIES]))

  const [state, formAction, pending] = useActionState(
    async (prev: ExpenseFormState, fd: FormData) => {
      const r = await saveExpenseAction(edit?.id ?? null, prev, fd)
      if (r.success) {
        toast.success(r.success)
        setOpen(false)
        if (params.get("nova")) {
          const sp = new URLSearchParams(params.toString())
          sp.delete("nova")
          router.replace(sp.size ? `${pathname}?${sp}` : pathname)
        }
      }
      if (r.error) toast.error(r.error)
      return r
    },
    {},
  )
  const fe = state.fieldErrors ?? {}

  function onReceipt(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append("file", file)
    startUpload(async () => {
      const r = await uploadReceiptAction(fd)
      if (r.error) toast.error(r.error)
      else if (r.url) setReceiptUrl(r.url)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <PlusIcon /> Lançar despesa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{edit ? "Editar despesa" : "Lançar despesa"}</DialogTitle>
          <DialogDescription>Entra no relatório financeiro e no lucro do mês.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-5" noValidate>
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="receiptUrl" value={receiptUrl} />

          <Tabs value={type} onValueChange={(v) => setType(v as "FIXED" | "VARIABLE")}>
            <TabsList className="w-full">
              <TabsTrigger value="FIXED">Fixa</TabsTrigger>
              <TabsTrigger value="VARIABLE">Variável</TabsTrigger>
            </TabsList>
          </Tabs>

          <Field label="Descrição" error={fe.description}>
            <Input
              name="description"
              defaultValue={edit?.description}
              placeholder="Aluguel do studio"
              className="h-12"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor" error={fe.amount}>
              <Input
                name="amount"
                inputMode="decimal"
                defaultValue={edit ? formatCentsExact(edit.amountCents).replace("R$ ", "") : ""}
                placeholder="900,00"
                className="h-12"
                startIcon={<span className="type-body">R$</span>}
                required
              />
            </Field>
            <Field label="Data" error={fe.date}>
              <Input
                name="date"
                type="date"
                defaultValue={edit?.dateYmd ?? todayYmd}
                className="h-12"
                required
              />
            </Field>
          </div>
          <Field label="Categoria" error={fe.category}>
            {newCategory ? (
              <div className="flex gap-2">
                <Input name="category" placeholder="Nova categoria" className="h-12" autoFocus />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Voltar para a lista"
                  onClick={() => setNewCategory(false)}
                >
                  <XIcon />
                </Button>
              </div>
            ) : (
              <select
                name="category"
                value={category}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setNewCategory(true)
                    setCategory("")
                  } else setCategory(e.target.value)
                }}
                className="type-body-l bg-surface-2 border-input text-foreground focus-visible:border-ring h-12 w-full rounded-md border px-4 outline-none"
              >
                <option value="">Escolha…</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__new__">+ Nova categoria</option>
              </select>
            )}
          </Field>

          <label className="flex items-center justify-between gap-4">
            <span className="flex flex-col">
              <span className="type-body-medium">Recorrência mensal</span>
              <span className="type-body text-secondary-txt">Lança automaticamente todo mês</span>
            </span>
            <Switch name="recurring" checked={recurring} onCheckedChange={setRecurring} />
          </label>

          <div className="flex flex-col gap-2">
            <Label>Comprovante (opcional)</Label>
            {receiptUrl ? (
              <div className="bg-surface-2 flex items-center justify-between rounded-md p-3">
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="type-body-medium flex items-center gap-2 text-pink-300 hover:underline"
                >
                  <PaperclipIcon className="size-4" /> Ver comprovante
                </a>
                <Button type="button" variant="ghost" size="sm" onClick={() => setReceiptUrl("")}>
                  Remover
                </Button>
              </div>
            ) : (
              <label className="border-strong hover:bg-surface-2 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed transition-colors">
                <PaperclipIcon className="size-4 text-pink-300" />
                <span className="type-body-medium">
                  {uploading ? "Enviando…" : "Anexar imagem (JPG/PNG)"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => onReceipt(e.target.files)}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : edit ? "Salvar" : "Lançar despesa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string[]
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
      {error?.[0] ? <p className="type-body text-error">{error[0]}</p> : null}
    </div>
  )
}
