import Link from "next/link"
import { AtSignIcon, MessageCircleIcon } from "lucide-react"

import { BottomNav } from "@/components/layout/bottom-nav"
import { BackgroundSlideshow } from "@/components/layout/background-slideshow"
import { PublicHeader } from "@/components/layout/public-header"
import { Button } from "@/components/ui/button"
import { SignOutButton } from "@/features/auth/components/sign-out-button"
import { getAreaBackgrounds } from "@/features/backgrounds/queries"
import { clientBottomNavItems, clientHeaderItems } from "@/features/public/nav"
import { getPublicBusinessOrThrow } from "@/features/public/queries"
import { getCurrentUser } from "@/lib/session"

/*
 * Moldura da área pública: mídias de fundo (escolhidas por tela em /admin/fundos),
 * header translúcido com menu no desktop (D1/D2), barra inferior no celular (M1–M8)
 * e rodapé com endereço, horário e contatos.
 * À direita de "Agendar horário": "Sair" se a cliente está logada, senão "Login".
 */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const [b, user] = await Promise.all([getPublicBusinessOrThrow(), getCurrentUser()])
  const backgrounds = await getAreaBackgrounds(b.id, "PUBLIC")
  const loggedIn = user?.role === "CLIENT"

  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <BackgroundSlideshow data={backgrounds} />
      <PublicHeader
        items={clientHeaderItems}
        businessName={b.name}
        ctaHref="/agendar"
        trailing={
          loggedIn ? (
            <SignOutButton role="CLIENT" variant="secondary" size="default" />
          ) : (
            <Button asChild variant="secondary">
              <Link href="/entrar">Login</Link>
            </Button>
          )
        }
      />
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
