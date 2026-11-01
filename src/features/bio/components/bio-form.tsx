"use client"

import { useActionState, useState, useTransition } from "react"
import Image from "next/image"
import {
  AtSignIcon as AtIcon,
  ClockIcon,
  MessageCircleIcon,
  SparklesIcon,
  UploadIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { saveBioAction, uploadBioImageAction } from "../actions"
import type { BioFormState } from "../schemas"

export type BioValues = {
  name: string
  slug: string
  tagline: string
  description: string
  instagram: string
  whatsapp: string
  addressLine: string
  neighborhood: string
  hoursSummary: string
  statsAppointments: string
  statsRating: string
  logoUrl: string
  photoUrl: string
  cancelMinHours: number
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border-subtle flex flex-col gap-5 rounded-md border p-5 sm:p-6">
      <h2 className="type-h3">{title}</h2>
      {children}
    </section>
  )
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string[]
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
      {hint && !error?.[0] ? <p className="type-body text-secondary-txt">{hint}</p> : null}
      {error?.[0] ? <p className="type-body text-error">{error[0]}</p> : null}
    </div>
  )
}

function ImagePicker({
  label,
  hint,
  value,
  uploading,
  onUpload,
  onClear,
}: {
  label: string
  hint: string
  value: string
  uploading: boolean
  onUpload: (files: FileList | null) => void
  onClear: () => void
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-4">
        <div className="bg-surface-2 relative size-20 shrink-0 overflow-hidden rounded-full">
          {value ? (
            <Image
              src={value}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
              unoptimized={value.endsWith(".svg")}
            />
          ) : (
            <SparklesIcon className="absolute inset-0 m-auto size-6 text-pink-300/70" />
          )}
        </div>
        <label className="border-strong hover:bg-surface-2 flex h-11 cursor-pointer items-center gap-2 rounded-full border px-4 transition-colors">
          <UploadIcon className="size-4 text-pink-300" />
          <span className="type-body-medium">{uploading ? "Enviando…" : "Enviar imagem"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => onUpload(e.target.files)}
            disabled={uploading}
          />
        </label>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remover"
            onClick={onClear}
          >
            <XIcon />
          </Button>
        ) : null}
      </div>
    </Field>
  )
}

/* "Bio & links" → "Editar página pública" (fluxo): campos da bio com pré-visualização ao vivo (M1). */
export function BioForm({ initial, baseUrl }: { initial: BioValues; baseUrl: string }) {
  const [v, setV] = useState<BioValues>(initial)
  const [uploading, startUpload] = useTransition()
  const [state, formAction, pending] = useActionState(async (prev: BioFormState, fd: FormData) => {
    const r = await saveBioAction(prev, fd)
    if (r.success) toast.success(r.success)
    if (r.error) toast.error(r.error)
    return r
  }, {})
  const fe = state.fieldErrors ?? {}
  const set = <K extends keyof BioValues>(k: K, value: BioValues[K]) =>
    setV((s) => ({ ...s, [k]: value }))

  function upload(field: "logoUrl" | "photoUrl", files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append("file", file)
    startUpload(async () => {
      const r = await uploadBioImageAction(fd)
      if (r.error) toast.error(r.error)
      else if (r.url) set(field, r.url)
    })
  }

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_390px]"
      noValidate
    >
      <input type="hidden" name="logoUrl" value={v.logoUrl} />
      <input type="hidden" name="photoUrl" value={v.photoUrl} />

      <div className="flex flex-col gap-6">
        <Section title="Apresentação">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Nome" error={fe.name}>
              <Input
                name="name"
                value={v.name}
                onChange={(e) => set("name", e.target.value)}
                className="h-12"
                required
              />
            </Field>
            <Field
              label="Endereço da página"
              error={fe.slug}
              hint={`${baseUrl}/${v.slug || "seu-nome"}`}
            >
              <Input
                name="slug"
                value={v.slug}
                onChange={(e) => set("slug", e.target.value)}
                className="h-12"
                required
              />
            </Field>
          </div>
          <Field label="Frase curta" error={fe.tagline} hint="Aparece abaixo do nome.">
            <Input
              name="tagline"
              value={v.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              placeholder="Nail designer · alongamento, blindagem e nail art"
              className="h-12"
            />
          </Field>
          <Field label="Apresentação" error={fe.description}>
            <Textarea
              name="description"
              value={v.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Conte o que você faz e como funciona o agendamento."
            />
          </Field>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ImagePicker
              label="Logo"
              hint="Círculo no topo da página e no ícone do app."
              value={v.logoUrl}
              uploading={uploading}
              onUpload={(files) => upload("logoUrl", files)}
              onClear={() => set("logoUrl", "")}
            />
            <ImagePicker
              label="Foto (opcional)"
              hint="Sua foto ou do estúdio."
              value={v.photoUrl}
              uploading={uploading}
              onUpload={(files) => upload("photoUrl", files)}
              onClear={() => set("photoUrl", "")}
            />
          </div>
        </Section>

        <Section title="Contatos e endereço">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Instagram" error={fe.instagram}>
              <Input
                name="instagram"
                value={v.instagram}
                onChange={(e) => set("instagram", e.target.value)}
                placeholder="leticiafagundes.nails"
                startIcon={<AtIcon />}
                className="h-12"
              />
            </Field>
            <Field label="WhatsApp" error={fe.whatsapp}>
              <Input
                name="whatsapp"
                value={v.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="(11) 9 8765-4321"
                inputMode="tel"
                startIcon={<MessageCircleIcon />}
                className="h-12"
              />
            </Field>
            <Field label="Endereço" error={fe.addressLine}>
              <Input
                name="addressLine"
                value={v.addressLine}
                onChange={(e) => set("addressLine", e.target.value)}
                placeholder="Studio LF · Rua das Flores, 120"
                className="h-12"
              />
            </Field>
            <Field label="Bairro / cidade" error={fe.neighborhood}>
              <Input
                name="neighborhood"
                value={v.neighborhood}
                onChange={(e) => set("neighborhood", e.target.value)}
                placeholder="Centro"
                className="h-12"
              />
            </Field>
          </div>
        </Section>

        <Section title="Destaques e regras">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field label="Horário resumido" error={fe.hoursSummary}>
              <Input
                name="hoursSummary"
                value={v.hoursSummary}
                onChange={(e) => set("hoursSummary", e.target.value)}
                placeholder="Seg a Sáb · 9h–19h"
                startIcon={<ClockIcon />}
                className="h-12"
              />
            </Field>
            <Field label="Atendimentos" error={fe.statsAppointments} hint="Ex.: +1.200">
              <Input
                name="statsAppointments"
                value={v.statsAppointments}
                onChange={(e) => set("statsAppointments", e.target.value)}
                placeholder="+1.200"
                className="h-12"
              />
            </Field>
            <Field label="Nota no Google" error={fe.statsRating} hint="Ex.: 4,9">
              <Input
                name="statsRating"
                value={v.statsRating}
                onChange={(e) => set("statsRating", e.target.value)}
                placeholder="4,9"
                className="h-12"
              />
            </Field>
          </div>
          <Field
            label="Cancelamento gratuito até (horas antes)"
            error={fe.cancelMinHours}
            hint="Depois desse prazo a cliente é orientada a falar no WhatsApp."
          >
            <Input
              name="cancelMinHours"
              type="number"
              min={0}
              max={168}
              value={v.cancelMinHours}
              onChange={(e) => set("cancelMinHours", Number(e.target.value))}
              className="h-12 max-w-40"
            />
          </Field>
        </Section>

        <div className="flex justify-end xl:hidden">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar página"}
          </Button>
        </div>
      </div>

      <aside className="flex w-full max-w-[360px] flex-col gap-4 xl:sticky xl:top-8 xl:max-w-none xl:self-start">
        <p className="type-caption text-secondary-txt">Pré-visualização da bio</p>
        <div className="bg-gradient-hero bg-base border-subtle flex flex-col items-center gap-3 rounded-lg border px-5 pt-8 pb-6 text-center">
          <div className="bg-surface-2 relative size-20 overflow-hidden rounded-full">
            {v.logoUrl ? (
              <Image
                src={v.logoUrl}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
                unoptimized={v.logoUrl.endsWith(".svg")}
              />
            ) : null}
          </div>
          <h3 className="display-l text-[26px] leading-8">{v.name || "Seu nome"}</h3>
          {v.tagline ? <p className="type-body text-secondary-txt">{v.tagline}</p> : null}
          <div className="type-body text-secondary-txt flex flex-wrap justify-center gap-3">
            {v.hoursSummary ? (
              <span className="flex items-center gap-1.5">
                <ClockIcon className="size-4" /> {v.hoursSummary}
              </span>
            ) : null}
            {v.statsAppointments ? (
              <span className="flex items-center gap-1.5">
                <SparklesIcon className="size-4" /> {v.statsAppointments} atendimentos
              </span>
            ) : null}
          </div>
          <Button type="button" tabIndex={-1} className="mt-2 w-full" aria-hidden>
            Agendar horário
          </Button>
          <div className="mt-2 flex w-full flex-col gap-2 text-left">
            {v.instagram ? (
              <div className="bg-surface flex items-center gap-3 rounded-md p-3">
                <span className="bg-magenta-500/18 flex size-9 items-center justify-center rounded-sm text-pink-300">
                  <AtIcon className="size-4" />
                </span>
                <span className="flex flex-col">
                  <span className="type-body-medium">Instagram</span>
                  <span className="type-body text-secondary-txt">@{v.instagram}</span>
                </span>
              </div>
            ) : null}
            {v.whatsapp ? (
              <div className="bg-surface flex items-center gap-3 rounded-md p-3">
                <span className="bg-magenta-500/18 flex size-9 items-center justify-center rounded-sm text-pink-300">
                  <MessageCircleIcon className="size-4" />
                </span>
                <span className="flex flex-col">
                  <span className="type-body-medium">WhatsApp</span>
                  <span className="type-body text-secondary-txt">
                    Tire dúvidas antes de agendar
                  </span>
                </span>
              </div>
            ) : null}
          </div>
          {v.addressLine ? (
            <p className="type-body text-muted-txt mt-2">
              {v.addressLine}
              {v.neighborhood ? ` · ${v.neighborhood}` : ""}
            </p>
          ) : null}
        </div>
        <div className="hidden flex-col gap-3 xl:flex">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Salvando…" : "Salvar página"}
          </Button>
          <Button asChild variant="secondary">
            <a href="/" target="_blank" rel="noreferrer">
              Ver página pública
            </a>
          </Button>
        </div>
      </aside>
    </form>
  )
}
