"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"
import { LogOutIcon, SparklesIcon } from "lucide-react"

export type SidebarItem = {
  href: string
  label: string
  icon: React.ReactNode
  match?: (pathname: string) => boolean
}

/*
 * Sidebar do painel (Figma A1–A6): 264px, logo + "Painel da profissional",
 * itens com ícone linear; ativo com fundo magenta sólido e texto pink-100.
 * Rodapé: "Ver minha página pública" (botão contornado) e "Sair".
 */
function Sidebar({
  items,
  businessName,
  publicHref = "/",
  onSignOut,
  className,
  activeHref,
  ...props
}: React.ComponentProps<"aside"> & {
  items: SidebarItem[]
  businessName: string
  publicHref?: string
  onSignOut?: () => void
  activeHref?: string
}) {
  const pathname = usePathname()
  const current = activeHref ?? pathname

  return (
    <aside
      data-slot="sidebar"
      className={cn(
        "bg-surface border-subtle hidden w-[264px] shrink-0 flex-col border-r lg:flex",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3 px-6 pt-8 pb-10">
        <Image src="/brand/logo-magenta.svg" alt="" width={48} height={48} className="size-12" />
        <div className="flex flex-col">
          <span className="display-label text-foreground text-[11px] tracking-[0.2em]">
            {businessName}
          </span>
          <span className="type-body text-secondary-txt">Painel da profissional</span>
        </div>
      </div>

      <nav aria-label="Painel" className="flex flex-1 flex-col gap-1 px-4">
        {items.map((item) => {
          const active = item.match ? item.match(current) : current === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              data-active={active || undefined}
              className="type-body-medium text-secondary-txt data-active:bg-magenta-500 hover:bg-surface-2 hover:text-foreground data-active:hover:bg-magenta-500 flex h-12 items-center gap-3 rounded-sm px-4 transition-colors data-active:text-pink-100 [&_svg]:size-5 [&_svg]:stroke-[1.5]"
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-2 px-4 pt-6 pb-8">
        <Link
          href={publicHref}
          className="type-body-medium border-strong text-foreground hover:bg-surface-2 flex h-12 items-center gap-2.5 rounded-sm border px-3 transition-colors [&_svg]:size-5 [&_svg]:stroke-[1.5] [&_svg]:text-pink-300"
        >
          <SparklesIcon aria-hidden />
          Ver minha página pública
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="type-body-medium text-muted-txt hover:bg-surface-2 hover:text-foreground flex h-12 items-center gap-3 rounded-sm px-4 transition-colors [&_svg]:size-5 [&_svg]:stroke-[1.5]"
        >
          <LogOutIcon aria-hidden />
          Sair
        </button>
      </div>
    </aside>
  )
}

export { Sidebar }
