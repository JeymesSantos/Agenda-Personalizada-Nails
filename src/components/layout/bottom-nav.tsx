"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"

export type BottomNavItem = {
  href: string
  label: string
  icon: React.ReactNode
  /* marca ativo também em subrotas (ex.: /agendar/...) */
  match?: (pathname: string) => boolean
}

/*
 * Barra de navegação inferior do Figma (cliente 4 itens, admin 5 itens):
 * fundo surface com borda superior, rótulo em caixa alta 11px,
 * item ativo em pink-300 com ponto magenta abaixo. Respeita a área segura do iOS.
 */
function BottomNav({
  items,
  className,
  activeHref,
  ...props
}: React.ComponentProps<"nav"> & { items: BottomNavItem[]; activeHref?: string }) {
  const pathname = usePathname()
  const current = activeHref ?? pathname

  return (
    <nav
      data-slot="bottom-nav"
      aria-label="Navegação principal"
      className={cn(
        "bg-surface/95 border-subtle pb-safe fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur lg:hidden",
        className,
      )}
      {...props}
    >
      <ul className="flex h-[72px] items-stretch">
        {items.map((item) => {
          const active = item.match ? item.match(current) : current === item.href
          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                data-active={active || undefined}
                className="text-muted-txt hover:text-foreground relative flex flex-1 flex-col items-center justify-center gap-1.5 transition-colors data-active:text-pink-300 [&_svg]:size-[22px] [&_svg]:stroke-[1.5]"
              >
                {item.icon}
                <span className="text-caption tracking-[0.04em] whitespace-nowrap">
                  {item.label}
                </span>
                {active ? (
                  <span
                    aria-hidden
                    className="bg-magenta-500 absolute bottom-1.5 size-1 rounded-full"
                  />
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export { BottomNav }
