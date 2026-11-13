import Image from "next/image"
import { WifiOffIcon } from "lucide-react"

import { RetryButton } from "./retry-button"

export const metadata = { title: "Sem conexão" }

/* Tela servida pelo service worker quando uma navegação falha sem internet. */
export default function OfflinePage() {
  return (
    <main className="bg-gradient-hero flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Image src="/brand/logo-magenta.svg" alt="" width={56} height={56} className="size-14" />
      <span className="bg-surface-2 flex size-14 items-center justify-center rounded-full text-pink-300">
        <WifiOffIcon className="size-6" aria-hidden />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="type-h1">Sem conexão</h1>
        <p className="type-body-l text-secondary-txt max-w-xs">
          A agenda precisa de internet para mostrar os horários. Verifique a conexão e tente de
          novo.
        </p>
      </div>
      <RetryButton />
    </main>
  )
}
