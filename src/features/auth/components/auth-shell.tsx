import Image from "next/image"
import Link from "next/link"
import { ChevronLeftIcon } from "lucide-react"

import { BackgroundSlideshow } from "@/components/layout/background-slideshow"
import { Button } from "@/components/ui/button"
import { getAreaBackgrounds } from "@/features/backgrounds/queries"
import { getPublicBusinessOrThrow } from "@/features/public/queries"

/*
 * Moldura das telas de entrar/cadastro: mídias de fundo da tela "Login e
 * cadastro" (/admin/fundos), logo, rótulo em Display/Label e título H1,
 * conteúdo centralizado (max 420px).
 */
export async function AuthShell({
  eyebrow,
  title,
  description,
  backHref = "/",
  children,
  footer,
}: {
  eyebrow: string
  title: string
  description?: string
  backHref?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  const business = await getPublicBusinessOrThrow()
  const backgrounds = await getAreaBackgrounds(business.id, "PUBLIC")
  return (
    <main className="relative isolate flex min-h-dvh flex-col">
      <BackgroundSlideshow data={backgrounds} />
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col px-5 pt-6 pb-12">
        <div className="flex items-center justify-between">
          <Button asChild variant="soft" size="icon-sm" aria-label="Voltar">
            <Link href={backHref}>
              <ChevronLeftIcon />
            </Link>
          </Button>
          <Image src="/brand/logo-magenta.svg" alt="" width={40} height={40} className="size-10" />
        </div>
        <header className="mt-10 mb-8 flex flex-col gap-2">
          <p className="display-label text-pink-300">{eyebrow}</p>
          <h1 className="type-h1">{title}</h1>
          {description ? <p className="type-body-l text-secondary-txt">{description}</p> : null}
        </header>
        {children}
        {footer ? (
          <div className="type-body text-secondary-txt mt-8 text-center">{footer}</div>
        ) : null}
      </div>
    </main>
  )
}
