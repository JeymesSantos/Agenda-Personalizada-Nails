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
    <main className="mx-auto flex w-full max-w-[1200px] min-w-0 flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6 lg:px-10 lg:py-8">
      <PageHeader eyebrow={`Clientes · ${clients.length}`} variant="heading" title="Clientes" />
      <div className="w-full sm:max-w-md">
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
            <li key={c.id} className="min-w-0">
              <Link
                href={`/admin/clientes/${c.id}`}
                className="bg-surface border-subtle hover:bg-surface-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md border p-3 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:gap-4 sm:p-4"
              >
                <Avatar className="size-10 sm:size-11">
                  <AvatarFallback className="bg-surface-2 type-body-medium text-pink-300">
                    {initials(c.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="type-h3 min-w-0 [overflow-wrap:anywhere]">{c.name}</span>
                    {!c.registered ? <Badge variant="neutral">Sem cadastro</Badge> : null}
                  </div>
                  <div className="type-body text-secondary-txt flex flex-wrap gap-x-3 gap-y-1">
                    <span className="whitespace-nowrap">{c.whatsapp ?? "Sem WhatsApp"}</span>
                    <span className="whitespace-nowrap">
                      {c.visits} visita{c.visits === 1 ? "" : "s"}
                    </span>
                    {c.lastVisitAt ? (
                      <span className="whitespace-nowrap">
                        Última {fmtShortDate(c.lastVisitAt, tz)}
                      </span>
                    ) : null}
                    {c.nextAt ? (
                      <span className="whitespace-nowrap">
                        Próxima {fmtShortDate(c.nextAt, tz)}
                      </span>
                    ) : null}
                  </div>
                  <span className="type-body-medium text-pink-300 sm:hidden">
                    Total gasto: {formatCents(c.spentCents)}
                  </span>
                </div>
                <span className="type-body-medium hidden whitespace-nowrap text-pink-300 sm:block">
                  <span className="sr-only">Total gasto: </span>
                  {formatCents(c.spentCents)}
                </span>
                <ChevronRightIcon
                  className="text-muted-txt size-4 shrink-0 sm:size-5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
