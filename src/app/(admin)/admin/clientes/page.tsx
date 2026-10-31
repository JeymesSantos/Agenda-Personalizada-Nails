import Link from "next/link"
import { ChevronRightIcon } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { ClientSearch } from "@/features/clients/components/client-search"
import { listClients } from "@/features/clients/queries"
import { fmtShortDate } from "@/lib/dates"
import { formatCents } from "@/lib/money"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export const metadata = { title: "Clientes" }

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

export default async function ClientesPage({ searchParams }: PageProps<"/admin/clientes">) {
  const user = await requireAdmin()
  const { q } = await searchParams
  const term = typeof q === "string" ? q : ""
  const business = await prisma.business.findUniqueOrThrow({ where: { ownerId: user.id } })
  const clients = await listClients(business.id, term)
  const tz = business.timezone

  return (
    <main className="flex w-full flex-col gap-6 px-5 py-6 lg:px-10 lg:py-8">
      <PageHeader eyebrow={`Clientes · ${clients.length}`} variant="heading" title="Clientes" />
      <div className="max-w-md">
        <ClientSearch initial={term} />
      </div>

      {clients.length === 0 ? (
        <EmptyState
          title={term ? "Nenhuma cliente encontrada" : "Nenhuma cliente ainda"}
          description={
            term ? "Tente outro nome ou WhatsApp." : "As clientes aparecem aqui assim que agendam."
          }
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {clients.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/clientes/${c.id}`}
                className="bg-surface border-subtle hover:bg-surface-2 flex items-center gap-4 rounded-md border p-4 transition-colors"
              >
                <Avatar className="size-11">
                  <AvatarFallback className="bg-surface-2 type-body-medium text-pink-300">
                    {initials(c.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="type-h3 truncate">{c.name}</span>
                    {!c.registered ? <Badge variant="neutral">Sem cadastro</Badge> : null}
                  </div>
                  <p className="type-body text-secondary-txt truncate">
                    {c.whatsapp ?? "sem WhatsApp"} · {c.visits} visita{c.visits === 1 ? "" : "s"}
                    {c.lastVisitAt ? ` · última ${fmtShortDate(c.lastVisitAt, tz)}` : ""}
                    {c.nextAt ? ` · próxima ${fmtShortDate(c.nextAt, tz)}` : ""}
                  </p>
                </div>
                <span className="type-body-medium hidden text-pink-300 sm:block">
                  {formatCents(c.spentCents)}
                </span>
                <ChevronRightIcon className="text-muted-txt size-5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
