import Link from "next/link"
import { addDays, addMonths } from "date-fns"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { AgendaGrid } from "@/features/agenda/components/agenda-grid"
import { AgendaToolbar } from "@/features/agenda/components/agenda-toolbar"
import { AppointmentPanel } from "@/features/agenda/components/appointment-panel"
import { MonthGrid } from "@/features/agenda/components/month-grid"
import { NewAppointmentDialog } from "@/features/agenda/components/new-appointment-dialog"
import { PanelHost } from "@/features/agenda/components/panel-host"
import {
  dayKey,
  getAgendaData,
  getAppointmentDetail,
  listVisibleServices,
  parseView,
} from "@/features/agenda/queries"
import { parseYmd } from "@/features/booking/core"
import { tz } from "@/lib/dates"
import { prisma } from "@/lib/prisma"
import { localDayStart, minutesFromDayStart } from "@/lib/scheduling"
import { requireAdmin } from "@/lib/session"

export const metadata = { title: "Agenda" }

export default async function AgendaPage({ searchParams }: PageProps<"/admin/agenda">) {
  const user = await requireAdmin()
  const sp = await searchParams
  const business = await prisma.business.findUniqueOrThrow({ where: { ownerId: user.id } })
  const timezone = business.timezone
  const now = new Date()

  const view = parseView(sp.visao, "semana")
  const anchor = (typeof sp.data === "string" ? parseYmd(sp.data, timezone) : null) ?? now
  const selectedId = typeof sp.agendamento === "string" ? sp.agendamento : undefined

  const [data, services, detail] = await Promise.all([
    getAgendaData(business.id, view, anchor, now, timezone),
    listVisibleServices(business.id),
    selectedId ? getAppointmentDetail(business.id, selectedId) : Promise.resolve(null),
  ])
  const preClient =
    typeof sp.cliente === "string"
      ? await prisma.user.findFirst({
          where: { id: sp.cliente, role: "CLIENT" },
          select: { id: true, name: true, whatsapp: true, passwordHash: true },
        })
      : null

  const step = view === "dia" ? 1 : view === "semana" ? 7 : 0
  const prev = view === "mes" ? addMonths(anchor, -1) : addDays(anchor, -step)
  const next = view === "mes" ? addMonths(anchor, 1) : addDays(anchor, step)
  const todayYmd = dayKey(now, timezone)
  const nowMin = minutesFromDayStart(now, localDayStart(now, timezone))

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-5 py-6 lg:px-10 lg:py-8">
      <PageHeader
        eyebrow={`Agenda · ${view === "dia" ? "Dia" : view === "semana" ? "Semana" : "Mês"}`}
        variant="heading"
        title="Agenda"
        actions={
          <>
            <Button asChild variant="secondary" className="hidden sm:inline-flex">
              <Link href="/admin/disponibilidade?bloquear=1">Bloquear / liberar</Link>
            </Button>
            <NewAppointmentDialog
              services={services}
              todayYmd={todayYmd}
              defaultOpen={sp.novo === "1"}
              initialClient={
                preClient
                  ? {
                      id: preClient.id,
                      name: preClient.name,
                      whatsapp: preClient.whatsapp,
                      registered: Boolean(preClient.passwordHash),
                    }
                  : null
              }
            />
          </>
        }
      />

      <AgendaToolbar
        view={view}
        prevYmd={dayKey(prev, timezone)}
        nextYmd={dayKey(next, timezone)}
        todayYmd={todayYmd}
        title={data.title}
      />

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          {view === "mes" ? (
            <MonthGrid
              days={data.days}
              blocks={data.blocks}
              monthIndex={tz(anchor, timezone).getMonth()}
            />
          ) : (
            <AgendaGrid
              days={data.days}
              blocks={data.blocks}
              gridStartMin={data.gridStartMin}
              gridEndMin={data.gridEndMin}
              selectedId={selectedId}
              nowMin={nowMin}
            />
          )}
        </div>
        {detail ? (
          <PanelHost>
            <AppointmentPanel
              appointment={detail}
              timezone={timezone}
              services={services}
              ymd={dayKey(detail.startsAt, timezone)}
              business={{
                name: business.name,
                addressLine: business.addressLine,
                neighborhood: business.neighborhood,
              }}
            />
          </PanelHost>
        ) : null}
      </div>
    </main>
  )
}
