"use client"

import {
  CheckIcon,
  ChevronRightIcon,
  DownloadIcon,
  ExternalLinkIcon,
  ShareIcon,
  SquarePlusIcon,
} from "lucide-react"
import { cn } from "cn"

import { useInstall } from "./install-context"

import { Button } from "@/components/ui/button"

const APP_ICON_SRC = "/icons/icon-192.png"
const outlinePink = "h-11 border-pink-300 text-pink-300 hover:text-pink-300"

const IOS_STEPS = [
  { icon: ShareIcon, text: "Toque em Compartilhar" },
  { icon: SquarePlusIcon, text: "Adicionar à Tela de Início" },
  { icon: CheckIcon, text: "Confirme em Adicionar" },
]

export function InstallCard({ className }: { className?: string }) {
  const { variant, status, message, install, openGuide, cardDismissed, dismissCard } = useInstall()
  if (!variant || variant === "manual") return null
  if (variant !== "internal" && cardDismissed) return null

  const copy = {
    native: { title: "Instale o app", body: "Abra a agenda direto da tela inicial" },
    ios: { title: "Instale o app", body: "Abra a agenda direto da tela inicial" },
    internal: {
      title: "Abra no navegador",
      body: "Você está no navegador de outro app. Abra no Chrome ou Safari para instalar.",
    },
  }[variant]

  return (
    <section
      aria-label="Instalar aplicativo"
      className={cn(
        "border-magenta-500/50 bg-surface flex flex-col gap-3.5 rounded-[20px] border p-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {variant === "internal" ? (
          <span className="bg-magenta-500/15 flex size-11 shrink-0 items-center justify-center rounded-sm text-pink-300">
            <ExternalLinkIcon className="size-5" aria-hidden="true" />
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={APP_ICON_SRC} alt="" className="size-11 shrink-0 rounded-sm" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-txt text-[15px] leading-[1.3] font-semibold">{copy.title}</p>
          <p className="text-secondary-txt text-[13px] leading-[1.4]">{copy.body}</p>
        </div>
      </div>

      {variant === "ios" && (
        <ol className="flex flex-col gap-2.5">
          {IOS_STEPS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="bg-magenta-500/15 flex size-7 shrink-0 items-center justify-center rounded-[8px] text-pink-300">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="type-body text-txt">{text}</span>
            </li>
          ))}
        </ol>
      )}

      {variant === "native" && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className={cn(outlinePink, "min-w-0 flex-1 whitespace-normal")}
            onClick={install}
            disabled={status === "pending"}
          >
            <DownloadIcon aria-hidden="true" />
            {status === "pending" ? "Aguardando confirmação…" : "Instalar"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-secondary-txt h-11"
            onClick={dismissCard}
          >
            Agora não
          </Button>
        </div>
      )}

      {variant === "ios" && (
        <Button variant="primary" size="sm" className="h-11 w-full" onClick={dismissCard}>
          Entendi
        </Button>
      )}

      {variant === "internal" && (
        <Button
          variant="secondary"
          size="sm"
          className={cn(outlinePink, "w-full")}
          onClick={(e) => openGuide(e.currentTarget)}
        >
          <ChevronRightIcon aria-hidden="true" />
          Como abrir no navegador
        </Button>
      )}

      <p role="status" className="type-body text-secondary-txt empty:hidden">
        {message}
      </p>
    </section>
  )
}

export function InstallButton({ className }: { className?: string }) {
  const { variant, status, install, openGuide } = useInstall()
  if (!variant) return null
  return (
    <Button
      variant="secondary"
      size="xs"
      className={cn("h-9 border-pink-300 px-4 text-pink-300 hover:text-pink-300", className)}
      disabled={status === "pending"}
      onClick={(e) => (variant === "native" ? install() : openGuide(e.currentTarget))}
    >
      <DownloadIcon aria-hidden="true" />
      Instalar app
    </Button>
  )
}

export function InstallNavItem() {
  const { variant, status, install, openGuide } = useInstall()
  if (!variant) return null
  return (
    <button
      type="button"
      disabled={status === "pending"}
      onClick={(e) => (variant === "native" ? install() : openGuide(e.currentTarget))}
      className="type-body hover:bg-surface-2 focus-visible:ring-ring/50 flex h-12 w-full items-center gap-2.5 rounded-sm border border-pink-300/35 px-3 text-pink-300 transition-colors focus-visible:ring-3 focus-visible:outline-none disabled:opacity-50"
    >
      <DownloadIcon className="size-5" aria-hidden="true" />
      Instalar app
    </button>
  )
}
