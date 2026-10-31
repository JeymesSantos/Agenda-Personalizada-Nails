import Image from "next/image"
import Link from "next/link"
import {
  BarChart3Icon,
  BellIcon,
  LockIcon,
  MessageCircleIcon,
  PlusIcon,
  ReceiptIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KpiCard } from "@/components/ui/kpi-card"
import { AgendaList } from "@/features/dashboard/components/agenda-list"
import { OccupancyRing } from "@/features/dashboard/components/occupancy-ring"
import { PeriodSwitch } from "@/features/dashboard/components/period-switch"
import { RevenueChart } from "@/features/dashboard/components/revenue-chart"
import { TopServices } from "@/features/dashboard/components/top-services"
import { getDashboardData, parsePeriodKind } from "@/features/dashboard/queries"
import { fmtDuration, fmtHeaderDate, fmtRange, greeting, minutesBetween } from "@/lib/dates"
import { formatCents, formatPercent } from "@/lib/money"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const user = await requireAdmin()
  const { periodo } = await searchParams
  const kind = parsePeriodKind(periodo)
  const business = await prisma.business.findUniqueOrThrow({ where: { ownerId: user.id } })
  const now = new Date()
  const data = await getDashboardData(business.id, kind, now, business.timezone)
  const tz = business.timezone
  const firstName = user.name.split(" ")[0]

  const periodLabel = {
    dia: "Hoje",
    semana: "Esta semana",
    mes: "Este mês",
    ano: "Este ano",
  }[kind]
  const compareLabel = {
    dia: "vs. ontem",
    semana: "vs. semana anterior",
    mes: "vs. mês anterior",
    ano: "vs. ano anterior",
  }[kind]

  const next = data.nextAppointment
  const profit = kind === "dia" ? data.monthSummary : data.summary
  const minutesToNext = next ? minutesBetween(now, next.startsAt) : null

  return (
    <main className="flex w-full flex-col gap-6 px-5 py-6 lg:px-10 lg:py-8">
      {/* Cabeçalho mobile (AM1): logo, data, saudação, sino */}
      <header className="flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-3">
          <Image src="/brand/logo-magenta.svg" alt="" width={40} height={40} className="size-10" />
          <div>
            <p className="display-label text-[11px] text-pink-300">{fmtHeaderDate(now, tz)}</p>
            <h1 className="type-h2">Olá, {firstName}</h1>
          </div>
        </div>
        <Button variant="soft" size="icon-sm" aria-label="Notificações">
          <BellIcon />
        </Button>
      </header>

      {/* Cabeçalho desktop (A1) */}
      <header className="hidden items-start justify-between gap-6 lg:flex">
        <div>
          <p className="display-label text-pink-300">{fmtHeaderDate(now, tz)}</p>
          <h1 className="type-h1 mt-1">
            {greeting(now, tz)}, {firstName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="secondary">
            <Link href="/admin/disponibilidade?bloquear=1">Bloquear horário</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/agenda?novo=1">
              <PlusIcon /> Novo agendamento
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <PeriodSwitch value={kind} />
        <p className="type-body text-secondary-txt hidden sm:block">
          {data.period.label} · comparado a {data.previous.label.toLowerCase()}
        </p>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard
          icon={<WalletIcon />}
          label={kind === "dia" ? "Faturamento hoje" : "Faturamento"}
          value={formatCents(data.summary.revenueCents)}
          delta={
            data.deltas.revenue != null
              ? `${formatPercent(data.deltas.revenue, true)} ${compareLabel}`
              : undefined
          }
          deltaTone={data.deltas.revenue != null && data.deltas.revenue < 0 ? "error" : "success"}
          hint={data.deltas.revenue == null ? periodLabel : undefined}
        />
        <KpiCard
          icon={<UsersIcon />}
          label="Atendimentos"
          value={String(data.summary.doneCount)}
          delta={
            data.deltas.done != null
              ? `${data.deltas.done >= 0 ? "+" : ""}${data.deltas.done} atendimentos`
              : undefined
          }
          deltaTone={data.deltas.done != null && data.deltas.done < 0 ? "error" : "success"}
          hint={
            data.deltas.done == null
              ? data.todayPending > 0
                ? `${data.todayPending} pendente${data.todayPending > 1 ? "s" : ""} de confirmação`
                : periodLabel
              : undefined
          }
        />
        <KpiCard
          icon={<BarChart3Icon />}
          label={kind === "dia" ? "Ocupação do dia" : "Ticket médio"}
          value={
            kind === "dia" ? `${data.occupancy.pct}%` : formatCents(data.summary.averageTicketCents)
          }
          delta={
            kind !== "dia" && data.deltas.ticket != null
              ? formatPercent(data.deltas.ticket, true)
              : undefined
          }
          deltaTone={data.deltas.ticket != null && data.deltas.ticket < 0 ? "error" : "success"}
          hint={
            kind === "dia"
              ? `${data.todayFreeSlots} horário${data.todayFreeSlots === 1 ? "" : "s"} livre${data.todayFreeSlots === 1 ? "" : "s"}`
              : undefined
          }
        />
        <KpiCard
          icon={<ReceiptIcon />}
          label={kind === "dia" ? "Lucro do mês" : "Lucro líquido"}
          value={formatCents(profit.profitCents)}
          delta={profit.revenueCents > 0 ? `${profit.marginPct}% do faturamento` : undefined}
          deltaTone="success"
          hint={`Despesas: ${formatCents(profit.expensesCents)}`}
        />
      </section>

      {/* Mobile: próximo atendimento + atalhos (AM1) */}
      {next ? (
        <section className="bg-gradient-primary glow-primary flex items-center justify-between gap-4 rounded-md p-5 lg:hidden">
          <div className="min-w-0">
            <p className="type-caption text-pink-100/80">
              Próximo atendimento
              {minutesToNext != null && minutesToNext > 0
                ? ` · em ${fmtDuration(minutesToNext).replace("h00", "h")}`
                : ""}
            </p>
            <p className="type-h2 mt-1 truncate text-pink-100">{next.clientName}</p>
            <p className="type-body truncate text-pink-100/90">
              {next.serviceTitle} · {fmtRange(next.startsAt, next.serviceEndsAt, tz)}
            </p>
          </div>
          {next.clientWhatsapp ? (
            <a
              href={`https://wa.me/55${next.clientWhatsapp}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Chamar no WhatsApp"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-pink-100"
            >
              <MessageCircleIcon className="size-5" />
            </a>
          ) : null}
        </section>
      ) : null}

      <section className="grid grid-cols-3 gap-3 lg:hidden">
        {[
          { href: "/admin/agenda?novo=1", label: "Agendar", icon: <PlusIcon /> },
          { href: "/admin/disponibilidade?bloquear=1", label: "Bloquear", icon: <LockIcon /> },
          { href: "/admin/despesas?nova=1", label: "Despesa", icon: <ReceiptIcon /> },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="bg-surface border-subtle hover:bg-surface-2 flex flex-col items-center gap-2.5 rounded-md border py-4 transition-colors"
          >
            <span className="bg-magenta-500/18 flex size-10 items-center justify-center rounded-sm text-pink-300 [&_svg]:size-5">
              {a.icon}
            </span>
            <span className="type-body-medium">{a.label}</span>
          </Link>
        ))}
      </section>

      {/* Desktop: gráfico + ocupação */}
      <section className="hidden grid-cols-[1fr_320px] gap-4 lg:grid">
        <Card>
          <CardHeader>
            <CardTitle>
              Faturamento x despesas por{" "}
              {data.seriesUnit === "week" ? "semana" : data.seriesUnit === "day" ? "dia" : "mês"}
            </CardTitle>
            <CardAction className="type-body text-secondary-txt flex items-center gap-4">
              <span className="flex items-center gap-2">
                <span className="bg-magenta-500 size-2 rounded-full" /> Faturamento
              </span>
              <span className="flex items-center gap-2">
                <span className="bg-elevated size-2 rounded-full" /> Despesas
              </span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.series} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ocupação da agenda</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5 pb-2">
            <OccupancyRing pct={data.occupancy.pct} />
            <p className="type-body text-secondary-txt text-center">
              {Math.round(data.occupancy.bookedMin / 60)} de{" "}
              {Math.round(data.occupancy.availableMin / 60)} horas disponíveis foram agendadas{" "}
              {periodLabel.toLowerCase().replace("este ", "neste ").replace("esta ", "nesta ")}.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Agenda de hoje + serviços mais vendidos */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Agenda de hoje</CardTitle>
            <CardAction>
              <Button asChild variant="link" size="sm">
                <Link href="/admin/agenda">Ver agenda completa</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <AgendaList items={data.today} timezone={tz} />
          </CardContent>
        </Card>
        <Card className="hidden lg:flex">
          <CardHeader>
            <CardTitle>Serviços mais vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <TopServices items={data.topServices} />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
