import "server-only"
import { addDays } from "date-fns"
import { Prisma } from "@/generated/prisma/client"
import type { AppointmentStatus } from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { isBookable, localDayStart } from "@/lib/scheduling"
import { ACTIVE_STATUSES, BookingError } from "@/features/booking/core"
import { appointmentNotice } from "./notice-text"

const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "DONE", "NO_SHOW"],
  CONFIRMED: ["DONE", "NO_SHOW", "CANCELLED", "PENDING"],
  DONE: ["CONFIRMED"],
  NO_SHOW: ["CONFIRMED"],
  CANCELLED: ["CONFIRMED"],
}

export async function changeAppointmentStatus(
  businessId: string,
  id: string,
  status: AppointmentStatus,
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const a = await tx.appointment.findFirst({
            where: { id, businessId },
            include: { service: true, business: true },
          })
          if (!a) throw new BookingError("Agendamento não encontrado.", "NOT_FOUND")
          if (!transitions[a.status].includes(status))
            throw new BookingError("Essa mudança de status não é permitida.", "INVALID")
          if (ACTIVE_STATUSES.includes(status) && !ACTIVE_STATUSES.includes(a.status)) {
            const from = localDayStart(a.startsAt, a.business.timezone)
            const to = addDays(from, 1)
            const [workingHours, exceptions, appointments] = await Promise.all([
              tx.workingHours.findMany({ where: { businessId } }),
              tx.scheduleException.findMany({
                where: { businessId, startsAt: { lt: to }, endsAt: { gt: from } },
              }),
              tx.appointment.findMany({
                where: {
                  businessId,
                  id: { not: id },
                  status: { in: ACTIVE_STATUSES },
                  startsAt: { lt: a.endsAt },
                  endsAt: { gt: a.startsAt },
                },
              }),
            ])
            if (
              !isBookable(a.startsAt, a.endsAt, {
                timezone: a.business.timezone,
                workingHours,
                exceptions,
                appointments,
              })
            ) {
              throw new BookingError(
                "Esse horário não está mais disponível. Escolha outro horário antes de reabrir.",
                "UNAVAILABLE",
              )
            }
          }
          return tx.appointment.update({
            where: { id },
            data: {
              status,
              cancelledAt: status === "CANCELLED" ? new Date() : null,
              cancelledBy: status === "CANCELLED" ? "ADMIN" : null,
              ...(status === "CANCELLED" || status === "NO_SHOW"
                ? {
                    notices: {
                      create: {
                        message: appointmentNotice(
                          status,
                          a.service.title,
                          a.startsAt,
                          a.business.timezone,
                        ),
                      },
                    },
                  }
                : {}),
            },
          })
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < 2
      )
        continue
      throw error
    }
  }
}
