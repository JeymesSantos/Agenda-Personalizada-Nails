import { NextResponse, type NextRequest } from "next/server"

import { getAppointmentByCode } from "@/features/booking/queries"

function icsDate(d: Date) {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z")
}

function escapeIcs(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

/* "Adicionar ao calendário" (M6): arquivo .ics do atendimento. */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/agendamento/[code]/ics">,
) {
  const { code } = await params
  const token = request.nextUrl.searchParams.get("t")
  const a = await getAppointmentByCode(code, token)
  if (!a) return new NextResponse("Não encontrado", { status: 404 })

  const location = [a.business.addressLine, a.business.neighborhood].filter(Boolean).join(", ")
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MinhaAgenda//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${a.code}@minhaagenda`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(a.startsAt)}`,
    `DTEND:${icsDate(a.serviceEndsAt)}`,
    `SUMMARY:${escapeIcs(`${a.service.title} · ${a.business.name}`)}`,
    `DESCRIPTION:${escapeIcs(`Comprovante #${a.code}. Cancelamento gratuito até ${a.business.cancelMinHours} h antes.`)}`,
    location ? `LOCATION:${escapeIcs(location)}` : null,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs(`Daqui a 2 h: ${a.service.title}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => Boolean(l))

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="agendamento-${a.code}.ics"`,
    },
  })
}
