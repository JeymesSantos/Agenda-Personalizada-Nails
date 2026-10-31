import Link from "next/link"
import { ChevronRightIcon } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { SignOutButton } from "@/features/auth/components/sign-out-button"
import { adminSidebarItems } from "@/features/admin/nav"

export const metadata = { title: "Mais" }

/* Item "Mais" da barra inferior (mobile): lista as áreas que não cabem na barra. */
export default function MaisPage() {
  const items = adminSidebarItems.filter((i) =>
    ["/admin/portfolio", "/admin/clientes", "/admin/bio"].includes(i.href),
  )
  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-5 py-6">
      <PageHeader
        eyebrow="Painel da profissional"
        variant="heading"
        title="Mais"
        actions={<SignOutButton role="ADMIN" />}
      />
      <ul className="flex flex-col gap-2">
        {items.map((i) => (
          <li key={i.href}>
            <Link
              href={i.href}
              className="bg-surface border-subtle hover:bg-surface-2 flex items-center gap-4 rounded-md border p-4 transition-colors [&_svg]:size-5 [&_svg]:stroke-[1.5]"
            >
              <span className="bg-magenta-500/18 flex size-10 shrink-0 items-center justify-center rounded-sm text-pink-300">
                {i.icon}
              </span>
              <span className="type-body-medium flex-1">{i.label}</span>
              <ChevronRightIcon className="text-muted-txt" />
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/"
            className="bg-surface border-subtle hover:bg-surface-2 flex items-center gap-4 rounded-md border p-4 transition-colors"
          >
            <span className="type-body-medium flex-1">Ver minha página pública</span>
            <ChevronRightIcon className="text-muted-txt size-5" />
          </Link>
        </li>
      </ul>
    </main>
  )
}
