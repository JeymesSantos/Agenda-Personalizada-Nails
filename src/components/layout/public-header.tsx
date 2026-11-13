"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"
import { Button } from "@/components/ui/button"

export type PublicNavItem = { href: string; label: string }

/*
 * Cabeçalho desktop da área pública (Figma D1/D2): logo + nome em caps,
 * links centrais (ativo em pink-300), botão "Agendar horário" à direita e,
 * depois dele, `trailing` (Sair/Login conforme a sessão).
 * Fundo levemente translúcido com blur para deixar as fotos do layout aparecerem.
 * No mobile só aparece a BottomNav, então o header fica oculto abaixo de lg.
 */
function PublicHeader({
  items,
  businessName,
  ctaHref = "/agendar",
  ctaLabel = "Agendar horário",
  trailing,
  className,
  activeHref,
  ...props
}: React.ComponentProps<"header"> & {
  items: PublicNavItem[]
  businessName: string
  ctaHref?: string
  ctaLabel?: string
  trailing?: React.ReactNode
  activeHref?: string
}) {
  const pathname = usePathname()
  const current = activeHref ?? pathname

  return (
    <header
      data-slot="public-header"
      className={cn(
        "border-subtle bg-background/60 hidden h-[88px] items-center border-b px-10 backdrop-blur-md lg:flex xl:px-20",
        className,
      )}
      {...props}
    >
      <Link href="/" className="flex items-center gap-4">
        <Image src="/brand/logo-magenta.svg" alt="" width={40} height={40} className="size-10" />
        <span className="display-label text-foreground text-[13px] tracking-[0.25em]">
          {businessName}
        </span>
      </Link>
      <nav aria-label="Páginas" className="ml-auto flex items-center gap-6 xl:gap-8">
        {items.map((item) => {
          const active = current === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "type-body-l hover:text-foreground whitespace-nowrap transition-colors",
                active ? "text-pink-300" : "text-secondary-txt",
              )}
            >
              {item.label}
            </Link>
          )
        })}
        <Button asChild className="ml-2">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
        {trailing}
      </nav>
    </header>
  )
}

export { PublicHeader }
