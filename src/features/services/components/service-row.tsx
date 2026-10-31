"use client"

import { useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { fmtDuration } from "@/lib/dates"
import { formatPrice } from "@/lib/money"
import { moveServiceAction, toggleServiceVisibleAction } from "../actions"

export type ServiceRowData = {
  id: string
  title: string
  categoryName: string | null
  durationMin: number
  bufferMin: number
  priceCents: number
  priceFrom: boolean
  visible: boolean
  photoUrl: string | null
  appointmentsCount: number
}

export function ServiceRow({
  service,
  isFirst,
  isLast,
}: {
  service: ServiceRowData
  isFirst: boolean
  isLast: boolean
}) {
  const [pending, startTransition] = useTransition()

  return (
    <li
      className="bg-surface border-subtle flex items-center gap-4 rounded-md border p-4 data-[hidden=true]:opacity-70"
      data-hidden={!service.visible}
    >
      <div className="bg-surface-2 relative size-16 shrink-0 overflow-hidden rounded-sm">
        {service.photoUrl ? (
          <Image src={service.photoUrl} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <SparklesIcon className="absolute inset-0 m-auto size-6 text-pink-300/70" aria-hidden />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/servicos/${service.id}`} className="type-h3 truncate hover:underline">
            {service.title}
          </Link>
          {service.categoryName ? <Badge variant="neutral">{service.categoryName}</Badge> : null}
          {!service.visible ? <Badge variant="warning">Oculto</Badge> : null}
        </div>
        <p className="type-body text-secondary-txt">
          {fmtDuration(service.durationMin)}
          {service.bufferMin > 0 ? ` · +${service.bufferMin} min` : ""} ·{" "}
          <span className="text-pink-300">
            {formatPrice(service.priceCents, service.priceFrom)}
          </span>
          {service.appointmentsCount > 0
            ? ` · ${service.appointmentsCount} agendamento${service.appointmentsCount > 1 ? "s" : ""}`
            : ""}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Switch
          aria-label="Visível para clientes"
          checked={service.visible}
          disabled={pending}
          onCheckedChange={(visible) =>
            startTransition(async () => {
              await toggleServiceVisibleAction(service.id, visible)
              toast.success(
                visible ? "Serviço visível no catálogo." : "Serviço oculto do catálogo.",
              )
            })
          }
        />
        <div className="hidden flex-col sm:flex">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Mover para cima"
            disabled={isFirst || pending}
            onClick={() => startTransition(() => moveServiceAction(service.id, "up"))}
          >
            <ChevronUpIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Mover para baixo"
            disabled={isLast || pending}
            onClick={() => startTransition(() => moveServiceAction(service.id, "down"))}
          >
            <ChevronDownIcon />
          </Button>
        </div>
        <Button asChild variant="soft" size="icon-sm" aria-label="Editar">
          <Link href={`/admin/servicos/${service.id}`}>
            <PencilIcon />
          </Link>
        </Button>
      </div>
    </li>
  )
}
