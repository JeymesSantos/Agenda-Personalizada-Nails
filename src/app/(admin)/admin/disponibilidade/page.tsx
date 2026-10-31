import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExceptionDialog } from "@/features/availability/components/exception-dialog"
import { ExceptionsList } from "@/features/availability/components/exceptions-list"
import { WorkingHoursForm } from "@/features/availability/components/working-hours-form"
import { getWorkingHours, listUpcomingExceptions } from "@/features/availability/queries"
import { fmt, fmtShortDate, fmtTime, tz } from "@/lib/dates"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export const metadata = { title: "Disponibilidade" }

function describeException(
  e: { startsAt: Date; endsAt: Date; allDay: boolean; type: "BLOCK" | "RELEASE" },
  timezone: string,
): string {
  const oneDay = e.endsAt.getTime() - e.startsAt.getTime() <= 24 * 60 * 60 * 1000
  if (!e.allDay) {
    return `${fmtShortDate(e.startsAt, timezone)} · ${fmtTime(e.startsAt, timezone)} – ${fmtTime(e.endsAt, timezone)}`
  }
  if (oneDay) return `${fmtShortDate(e.startsAt, timezone)} · dia inteiro`
  const last = new Date(e.endsAt.getTime() - 1)
  const sameMonth = fmt(e.startsAt, "M/yyyy", timezone) === fmt(last, "M/yyyy", timezone)
  return sameMonth
    ? `${fmt(e.startsAt, "d", timezone)} a ${fmt(last, "d 'de' MMMM", timezone)}`
    : `${fmt(e.startsAt, "d MMM", timezone)} a ${fmt(last, "d MMM", timezone)}`
}

export default async function DisponibilidadePage({
  searchParams,
}: PageProps<"/admin/disponibilidade">) {
  const user = await requireAdmin()
  const { bloquear } = await searchParams
  const business = await prisma.business.findUniqueOrThrow({ where: { ownerId: user.id } })
  const now = new Date()
  const [days, exceptions] = await Promise.all([
    getWorkingHours(business.id),
    listUpcomingExceptions(business.id, now),
  ])
  const today = fmt(tz(now, business.timezone), "yyyy-MM-dd", business.timezone)

  return (
    <main className="flex w-full flex-col gap-6 px-5 py-6 lg:px-10 lg:py-8">
      <PageHeader
        eyebrow="Agenda · Disponibilidade"
        variant="heading"
        title="Dias e horários de atendimento"
        actions={
          <ExceptionDialog
            today={today}
            defaultOpen={bloquear === "1"}
            trigger={<Button>Bloquear / liberar</Button>}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Horário de funcionamento</CardTitle>
            <CardDescription>
              Base usada pelo motor de horários. Exceções ficam ao lado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkingHoursForm days={days} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bloqueios e exceções</CardTitle>
          </CardHeader>
          <CardContent>
            <ExceptionsList
              items={exceptions.map((e) => ({
                id: e.id,
                type: e.type,
                title: describeException(e, business.timezone),
                reason: e.reason,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
