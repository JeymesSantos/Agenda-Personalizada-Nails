import Image from "next/image"
import Link from "next/link"
import { ChevronLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/*
 * Moldura das telas de entrar/cadastro: fundo com o gradiente de hero,
 * logo, rótulo em Display/Label e título H1, conteúdo centralizado (max 420px).
 */
export function AuthShell({
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
  return (
    <main className="bg-gradient-hero flex min-h-dvh flex-col">
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
