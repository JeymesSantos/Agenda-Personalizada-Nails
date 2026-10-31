"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Sheet, SheetBody, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/use-media-query"

/*
 * Onde o painel de detalhe aparece: coluna à direita no desktop (A2),
 * sheet inferior no celular (AM2). Fechar remove ?agendamento da URL.
 */
export function PanelHost({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const isDesktop = useMediaQuery(DESKTOP_QUERY, true)

  const close = () => {
    const sp = new URLSearchParams(params.toString())
    sp.delete("agendamento")
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
  }

  if (isDesktop) {
    return (
      <aside className="bg-surface border-subtle w-[340px] shrink-0 self-start rounded-md border p-5">
        {children}
      </aside>
    )
  }

  return (
    <Sheet open onOpenChange={(o) => !o && close()}>
      <SheetContent side="bottom">
        <SheetTitle className="sr-only">Detalhe do agendamento</SheetTitle>
        <SheetBody className="pb-6">{children}</SheetBody>
      </SheetContent>
    </Sheet>
  )
}
