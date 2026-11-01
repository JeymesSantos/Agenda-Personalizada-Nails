"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Sheet, SheetBody, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { DESKTOP_QUERY, XL_QUERY, useMediaQuery } from "@/lib/use-media-query"

/*
 * Onde o painel de detalhe aparece:
 * - ≥ 1280px: coluna à direita da grade (A2);
 * - 1024–1279px: sheet lateral direito (a grade semanal não cabe ao lado);
 * - celular: sheet inferior (AM2).
 * Fechar remove ?agendamento da URL.
 */
export function PanelHost({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const isXl = useMediaQuery(XL_QUERY, true)
  const isDesktop = useMediaQuery(DESKTOP_QUERY, true)

  const close = () => {
    const sp = new URLSearchParams(params.toString())
    sp.delete("agendamento")
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
  }

  if (isXl) {
    return (
      <aside className="bg-surface border-subtle w-[340px] shrink-0 self-start rounded-md border p-5">
        {children}
      </aside>
    )
  }

  return (
    <Sheet open onOpenChange={(o) => !o && close()}>
      <SheetContent side={isDesktop ? "right" : "bottom"}>
        <SheetTitle className="sr-only">Detalhe do agendamento</SheetTitle>
        <SheetBody className={isDesktop ? "pt-10 pb-6" : "pb-6"}>{children}</SheetBody>
      </SheetContent>
    </Sheet>
  )
}
