"use client"

import * as React from "react"
import { useActionState, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { MinusIcon, PlusIcon, UploadIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Chip, ChipGroup } from "@/components/ui/chip"
import { InfoBox } from "@/components/ui/info-box"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { fmtDuration } from "@/lib/dates"
import { formatCentsExact, parseCents } from "@/lib/money"
import { createCategoryAction, uploadServicePhotoAction } from "../actions"
import { BUFFER_STEP, DURATION_STEP, type ServiceFormState } from "../schemas"
import { ServiceCard } from "./service-card"

type Category = { id: string; name: string }

export type ServiceFormValues = {
  title: string
  description: string
  categoryId: string
  durationMin: number
  bufferMin: number
  priceCents: number
  priceFrom: boolean
  visible: boolean
  photoUrls: string[]
}

const defaults: ServiceFormValues = {
  title: "",
  description: "",
  categoryId: "",
  durationMin: 60,
  bufferMin: 15,
  priceCents: 0,
  priceFrom: false,
  visible: true,
  photoUrls: [],
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border-subtle flex flex-col gap-5 rounded-md border p-5 sm:p-6">
      <h2 className="type-h3">{title}</h2>
      {children}
    </section>
  )
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="type-body text-error">{errors[0]}</p> : null
}

/* Stepper "− 2h 00min +" do Figma (duração e reorganização). */
function MinuteStepper({
  name,
  value,
  onChange,
  step,
  min,
  max,
  format,
  label,
  hint,
}: {
  name: string
  value: number
  onChange: (v: number) => void
  step: number
  min: number
  max: number
  format: (v: number) => string
  label: string
  hint: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`${name}-value`}>{label}</Label>
      <div className="bg-surface-2 border-input flex h-14 items-center justify-between rounded-md border px-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Diminuir ${label.toLowerCase()}`}
          onClick={() => onChange(Math.max(min, value - step))}
        >
          <MinusIcon />
        </Button>
        <span id={`${name}-value`} className="type-body-l text-foreground whitespace-nowrap">
          {format(value)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          onClick={() => onChange(Math.min(max, value + step))}
        >
          <PlusIcon />
        </Button>
        <input type="hidden" name={name} value={value} />
      </div>
      <p className="type-body text-secondary-txt">{hint}</p>
    </div>
  )
}

export function ServiceForm({
  action,
  initial,
  categories,
  typicalOpenMinutes,
  cancelHref = "/admin/servicos",
  onDelete,
}: {
  action: (prev: ServiceFormState, formData: FormData) => Promise<ServiceFormState>
  initial?: Partial<ServiceFormValues>
  categories: Category[]
  typicalOpenMinutes: number
  cancelHref?: string
  onDelete?: () => Promise<{ error?: string }>
}) {
  const [state, formAction, pending] = useActionState(action, {})
  const [values, setValues] = useState<ServiceFormValues>({ ...defaults, ...initial })
  const [priceText, setPriceText] = useState(
    initial?.priceCents ? formatCentsExact(initial.priceCents).replace("R$ ", "") : "",
  )
  const [cats, setCats] = useState<Category[]>(categories)
  const [newCategory, setNewCategory] = useState("")
  const [uploading, startUpload] = useTransition()
  const [deleting, startDelete] = useTransition()
  const fe = state.fieldErrors ?? {}

  const set = <K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }))

  const total = values.durationMin + values.bufferMin
  const perDay = total > 0 && typicalOpenMinutes > 0 ? Math.floor(typicalOpenMinutes / total) : 0
  const impactPct =
    typicalOpenMinutes > 0 ? Math.min(100, Math.round((total / typicalOpenMinutes) * 100)) : 0

  function onFiles(files: FileList | null) {
    if (!files?.length) return
    const remaining = 6 - values.photoUrls.length
    const list = Array.from(files).slice(0, remaining)
    if (list.length === 0) {
      toast.error("No máximo 6 fotos por serviço.")
      return
    }
    startUpload(async () => {
      for (const file of list) {
        const fd = new FormData()
        fd.append("file", file)
        const result = await uploadServicePhotoAction(fd)
        if (result.error) toast.error(result.error)
        else if (result.url) setValues((v) => ({ ...v, photoUrls: [...v.photoUrls, result.url!] }))
      }
    })
  }

  async function addCategory() {
    const result = await createCategoryAction(newCategory)
    if (result.error) return toast.error(result.error)
    if (result.id) {
      const id = result.id
      setCats((c) => (c.some((x) => x.id === id) ? c : [...c, { id, name: newCategory.trim() }]))
      set("categoryId", id)
      setNewCategory("")
    }
  }

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]"
      noValidate
    >
      <input type="hidden" name="categoryId" value={values.categoryId} />
      {values.photoUrls.map((url) => (
        <input key={url} type="hidden" name="photoUrls" value={url} />
      ))}

      <div className="flex flex-col gap-6">
        {state.error ? <InfoBox tone="error">{state.error}</InfoBox> : null}

        <Section title="Informações">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título do serviço</Label>
            <Input
              id="title"
              name="title"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Alongamento em gel"
              aria-invalid={fe.title ? true : undefined}
              required
            />
            <FieldError errors={fe.title} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="O que inclui, durabilidade média, observações."
              aria-invalid={fe.description ? true : undefined}
            />
            <FieldError errors={fe.description} />
          </div>
          <div className="flex flex-col gap-3">
            <Label>Categoria</Label>
            <ChipGroup className="flex-wrap">
              {cats.map((c) => (
                <Chip
                  key={c.id}
                  active={values.categoryId === c.id}
                  onClick={() => set("categoryId", values.categoryId === c.id ? "" : c.id)}
                >
                  {c.name}
                </Chip>
              ))}
            </ChipGroup>
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nova categoria"
                className="h-12"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    void addCategory()
                  }
                }}
              />
              <Button
                type="button"
                variant="soft"
                size="sm"
                onClick={addCategory}
                disabled={!newCategory.trim()}
              >
                Adicionar
              </Button>
            </div>
            <FieldError errors={fe.categoryId} />
          </div>
        </Section>

        <Section title="Fotos">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {values.photoUrls.map((url) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-sm">
                <Image src={url} alt="" fill sizes="160px" className="object-cover" />
                <button
                  type="button"
                  aria-label="Remover foto"
                  onClick={() =>
                    set(
                      "photoUrls",
                      values.photoUrls.filter((u) => u !== url),
                    )
                  }
                  className="bg-base/80 text-foreground absolute top-2 right-2 flex size-8 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
            ))}
            {values.photoUrls.length < 6 ? (
              <label
                className="border-magenta-500/60 hover:bg-magenta-500/5 flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed text-center transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  onFiles(e.dataTransfer.files)
                }}
              >
                <UploadIcon className="size-5 text-pink-300" aria-hidden />
                <span className="type-body-medium text-pink-300">
                  {uploading ? "Enviando…" : "Arraste ou clique"}
                </span>
                <span className="type-body text-secondary-txt px-2">JPG ou PNG até 5 MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={(e) => onFiles(e.target.files)}
                  disabled={uploading}
                />
              </label>
            ) : null}
          </div>
          <FieldError errors={fe.photoUrls} />
        </Section>

        <Section title="Tempo e valor">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <MinuteStepper
              name="durationMin"
              label="Duração do serviço"
              hint="Tempo com a cliente"
              value={values.durationMin}
              onChange={(v) => set("durationMin", v)}
              step={DURATION_STEP}
              min={15}
              max={480}
              format={(v) => fmtDuration(v).replace("h", "h ") + (v >= 60 ? "min" : "")}
            />
            <MinuteStepper
              name="bufferMin"
              label="Tempo de reorganização"
              hint="Limpeza e preparo após o atendimento"
              value={values.bufferMin}
              onChange={(v) => set("bufferMin", v)}
              step={BUFFER_STEP}
              min={0}
              max={120}
              format={(v) => `${v} min`}
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Valor</Label>
              <Input
                id="price"
                name="price"
                inputMode="decimal"
                placeholder="R$ 180,00"
                value={priceText}
                onChange={(e) => {
                  setPriceText(e.target.value)
                  const cents = parseCents(e.target.value)
                  if (cents != null) set("priceCents", cents)
                }}
                aria-invalid={fe.price ? true : undefined}
                startIcon={<span className="type-body-l">R$</span>}
              />
              <p className="type-body text-secondary-txt">Exibido no catálogo</p>
              <FieldError errors={fe.price} />
            </div>
          </div>
          <FieldError errors={fe.durationMin} />
          <FieldError errors={fe.bufferMin} />

          <label className="border-subtle flex items-center justify-between gap-4 border-t pt-5">
            <span className="flex flex-col">
              <span className="type-body-medium">Valor &ldquo;a partir de&rdquo;</span>
              <span className="type-body text-secondary-txt">
                Mostra &ldquo;R$ 15+&rdquo; quando o preço varia
              </span>
            </span>
            <Switch
              name="priceFrom"
              checked={values.priceFrom}
              onCheckedChange={(c) => set("priceFrom", c)}
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="flex flex-col">
              <span className="type-body-medium">Visível para clientes</span>
              <span className="type-body text-secondary-txt">
                Desative para ocultar sem excluir
              </span>
            </span>
            <Switch
              name="visible"
              checked={values.visible}
              onCheckedChange={(c) => set("visible", c)}
            />
          </label>
        </Section>

        <div className="flex flex-wrap items-center justify-between gap-3 xl:hidden">
          <Button asChild variant="secondary">
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar serviço"}
          </Button>
        </div>
      </div>

      <aside className="flex w-full max-w-[360px] flex-col gap-4 xl:sticky xl:top-8 xl:max-w-none xl:self-start">
        <p className="type-caption text-secondary-txt">Pré-visualização no app da cliente</p>
        <ServiceCard
          service={{
            title: values.title || "Nome do serviço",
            description: values.description,
            durationMin: values.durationMin,
            bufferMin: values.bufferMin,
            priceCents: values.priceCents,
            priceFrom: values.priceFrom,
            photoUrl: values.photoUrls[0] ?? null,
          }}
        />
        <InfoBox tone="magenta">
          <p className="type-body-medium text-foreground mb-2">Impacto na agenda</p>
          <div className="bg-elevated mb-3 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-gradient-primary h-full rounded-full"
              style={{ width: `${impactPct}%` }}
            />
          </div>
          Cada atendimento bloqueia {fmtDuration(total)} na agenda (
          {fmtDuration(values.durationMin)} de serviço
          {values.bufferMin > 0 ? ` + ${values.bufferMin} min de reorganização` : ""}).
          {perDay > 0
            ? ` No seu horário atual cabem até ${perDay} atendimento${perDay > 1 ? "s" : ""} por dia.`
            : ""}
        </InfoBox>
        <div className="hidden flex-col gap-3 xl:flex">
          <Button type="submit" disabled={pending} size="lg">
            {pending ? "Salvando…" : "Salvar serviço"}
          </Button>
          <Button asChild variant="secondary">
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
          {onDelete ? (
            <Button
              type="button"
              variant="danger"
              disabled={deleting}
              onClick={() => {
                if (!confirm("Excluir este serviço?")) return
                startDelete(async () => {
                  const r = await onDelete()
                  if (r.error) toast.error(r.error)
                  else toast.success("Serviço excluído.")
                })
              }}
            >
              Excluir serviço
            </Button>
          ) : null}
        </div>
      </aside>
    </form>
  )
}
