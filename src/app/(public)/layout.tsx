import { AtSignIcon, MessageCircleIcon } from "lucide-react"

import { BottomNav } from "@/components/layout/bottom-nav"
import { PublicHeader } from "@/components/layout/public-header"
import { clientBottomNavItems, clientHeaderItems } from "@/features/public/nav"
import { getPublicBusinessOrThrow } from "@/features/public/queries"

/*
 * Moldura da área pública: header com menu no desktop (D1/D2), barra inferior
 * no celular (M1–M8) e rodapé com endereço, horário e contatos.
 */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const b = await getPublicBusinessOrThrow()

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader items={clientHeaderItems} businessName={b.name} ctaHref="/agendar" />
      <div className="flex flex-1 flex-col pb-24 lg:pb-0">{children}</div>
      <footer className="border-subtle type-body text-secondary-txt hidden items-center justify-between border-t px-10 py-8 lg:flex xl:px-20">
        <p>{[b.addressLine, b.neighborhood, b.hoursSummary].filter(Boolean).join(" · ")}</p>
        <div className="flex items-center gap-8">
          {b.instagram ? (
            <a
              href={`https://instagram.com/${b.instagram}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground flex items-center gap-2"
            >
              <AtSignIcon className="size-4" /> @{b.instagram}
            </a>
          ) : null}
          {b.whatsapp ? (
            <a
              href={`https://wa.me/55${b.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground flex items-center gap-2"
            >
              <MessageCircleIcon className="size-4" /> WhatsApp
            </a>
          ) : null}
        </div>
      </footer>
      <BottomNav items={clientBottomNavItems} />
    </div>
  )
}
