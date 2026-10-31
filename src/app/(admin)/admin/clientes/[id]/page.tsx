import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeftIcon, MessageCircleIcon, PlusIcon } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KpiCard } from "@/components/ui/kpi-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { ClientContactForm } from "@/features/clients/components/client-contact-form"
import { ClientNotes } from "@/features/clients/components/client-notes"
import { getClientProfile } from "@/features/clients/queries"
import { fmt, fmtRange, fmtShortDate } from "@/lib/dates"
import { formatCents } from "@/lib/money"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export const metadata = { title: "Cliente" }

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

export default async function ClientePage({ params }: PageProps<"/admin/clientes/[id]">) {
  const { id } = await params
  const user = await requireAdmin()
  const business = await prisma.business.findUniqueOrThrow({ where: { ownerId: user.id } })
  const profile = await getClientProfile(business.id, id)
  if (!profile) notFound()
  const tz = business.timezone
  const c = profile.user

  const AppointmentRow = ({ a }: { a: (typeof profile.appointments)[number] }) => (
    <li>
      <Link
        href={`/admin/agenda?visao=dia&data=${a.startsAt.toISOString().slice(0, 10)}&agendamento=${a.id}`}
        className="bg-surface-2 hover:bg-elevated flex items-center gap-4 rounded-sm p-3.5 transition-colors"
      >
        <div className="flex w-16 shrink-0 flex-col">
          <span className="type-body-medium">{fmtShortDate(a.startsAt, tz)}</span>
          <span className="type-body text-muted-txt">{fmt(a.startsAt, "HH:mm", tz)}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="type-body-medium truncate">{a.service.title}</span>
          <span className="type-body text-secondary-txt">
            {fmtRange(a.startsAt, a.serviceEndsAt, tz)} · {formatCents(a.priceCents)}
          </span>
        </div>
        <StatusBadge status={a.status} />
      </Link>
    </li>
  )

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-5 py-6 lg:px-10 lg:py-8">
      <PageHeader
        eyebrow="Clientes"
        variant="heading"
        leading={
          <Button asChild variant="soft" size="icon-sm" aria-label="Voltar" className="mt-1">
            <Link href="/admin/clientes">
              <ChevronLeftIcon />
            </Link>
          </Button>
        }
        title={
          <span className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback className="bg-surface-2 type-body-medium text-pink-300">
                {initials(c.name)}
              </AvatarFallback>
            </Avatar>
            {c.name}
          </span>
        }
        description={`${c.passwordHash ? "Cliente com cadastro" : "Cliente sem cadastro"} · desde ${fmt(c.createdAt, "MMM yyyy", tz)}`}
        actions={
          <>
            {c.whatsapp ? (
              <Button asChild variant="secondary">
                <a href={`https://wa.me/55${c.whatsapp}`} target="_blank" rel="noreferrer">
                  <MessageCircleIcon /> WhatsApp
                </a>
              </Button>
            ) : null}
            <Button asChild>
              <Link href={`/admin/agenda?novo=1&cliente=${c.id}`}>
                <PlusIcon /> Agendar
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Visitas concluídas"
          value={String(profile.visits)}
          hint={
            profile.noShows
              ? `${profile.noShows} falta${profile.noShows > 1 ? "s" : ""}`
              : "Nenhuma falta"
          }
        />
        <KpiCard
          label="Total gasto"
          value={formatCents(profile.spentCents)}
          hint={
            profile.visits
              ? `Ticket médio ${formatCents(Math.round(profile.spentCents / profile.visits))}`
              : undefined
          }
        />
        <KpiCard
          label="Última visita"
          value={profile.lastVisitAt ? fmtShortDate(profile.lastVisitAt, tz) : "—"}
        />
        <KpiCard
          label="Próximo horário"
          value={profile.upcoming[0] ? fmtShortDate(profile.upcoming[0].startsAt, tz) : "—"}
          hint={
            profile.cancellations
              ? `${profile.cancellations} cancelamento${profile.cancellations > 1 ? "s" : ""}`
              : undefined
          }
        />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Próximos ({profile.upcoming.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.upcoming.length === 0 ? (
                <p className="type-body text-secondary-txt">Nenhum horário futuro.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {profile.upcoming.map((a) => (
                    <AppointmentRow key={a.id} a={a} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Histórico ({profile.past.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.past.length === 0 ? (
                <p className="type-body text-secondary-txt">Sem atendimentos anteriores.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {profile.past.slice(0, 30).map((a) => (
                    <AppointmentRow key={a.id} a={a} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Anotações</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientNotes clientId={c.id} notes={profile.notes} timezone={tz} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientContactForm clientId={c.id} name={c.name} whatsapp={c.whatsapp} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
