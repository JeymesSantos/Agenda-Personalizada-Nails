import "server-only"
import { subDays } from "date-fns"

import { prisma } from "@/lib/prisma"

export async function getWorkingHours(businessId: string) {
  const rows = await prisma.workingHours.findMany({
    where: { businessId },
    orderBy: { weekday: "asc" },
  })
  /* garante 7 linhas (domingo a sábado) mesmo que o cadastro esteja incompleto */
  return Array.from({ length: 7 }, (_, weekday) => {
    const row = rows.find((r) => r.weekday === weekday)
    return (
      row ?? {
        weekday,
        enabled: false,
        startMin: 9 * 60,
        endMin: 19 * 60,
        breakStartMin: null,
        breakEndMin: null,
      }
    )
  })
}

/** Exceções a partir de ontem (as passadas há mais tempo não interessam na lista). */
export async function listUpcomingExceptions(businessId: string, now: Date) {
  return prisma.scheduleException.findMany({
    where: { businessId, endsAt: { gte: subDays(now, 1) } },
    orderBy: { startsAt: "asc" },
  })
}

/** Agendamentos ativos que cruzam [startsAt, endsAt): avisa antes de bloquear. */
export async function countActiveAppointmentsInRange(
  businessId: string,
  startsAt: Date,
  endsAt: Date,
) {
  return prisma.appointment.count({
    where: {
      businessId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  })
}
