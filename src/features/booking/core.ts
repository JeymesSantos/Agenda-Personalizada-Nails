import "server-only"
import { TZDate } from "@date-fns/tz"
import { addDays, addMinutes } from "date-fns"

import { Prisma } from "@/generated/prisma/client"
import type { AppointmentOrigin, AppointmentStatus } from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import {
  getAvailableSlots,
  getMonthAvailability,
  isBookable,
  localDayStart,
  type DayAvailability,
  type Slot,
} from "@/lib/scheduling"

/*
 * Núcleo de reserva compartilhado entre o painel (agendamento manual, remarcação)
 * e a jornada da cliente (passo 2 e 3). Toda criação/remarcação passa por
 * `bookAppointment`, que revalida a disponibilidade dentro de uma transação
 * serializável — dois pedidos simultâneos para o mesmo horário resultam em um
 * sucesso e um erro tratado.
 */

export const ACTIVE_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "DONE"]

export class BookingError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAVAILABLE" | "NOT_FOUND" | "INVALID",
  ) {
    super(message)
  }
}

export function parseYmd(ymd: string, timezone: string): TZDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!m) return null
  const [, y, mo, d] = m.map(Number)
  const date = new TZDate(y, mo - 1, d, 0, 0, 0, timezone)
  return Number.isNaN(date.getTime()) ? null : date
}

async function loadSchedule(
  businessId: string,
  from: Date,
  to: Date,
  ignoreAppointmentId?: string,
) {
  const [business, workingHours, exceptions, appointments] = await Promise.all([
    prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: { timezone: true, slotStepMinutes: true },
    }),
    prisma.workingHours.findMany({ where: { businessId } }),
    prisma.scheduleException.findMany({
      where: { businessId, endsAt: { gt: from }, startsAt: { lt: to } },
    }),
    prisma.appointment.findMany({
      where: {
        businessId,
        status: { in: ACTIVE_STATUSES },
        endsAt: { gt: from },
        startsAt: { lt: to },
        ...(ignoreAppointmentId ? { id: { not: ignoreAppointmentId } } : {}),
      },
      select: { startsAt: true, endsAt: true },
    }),
  ])
  return { business, workingHours, exceptions, appointments }
}

/** Slots do serviço num dia (data local "YYYY-MM-DD"). */
export async function slotsForDay(
  businessId: string,
  serviceId: string,
  ymd: string,
  options: { ignoreAppointmentId?: string; now?: Date; minNoticeMin?: number } = {},
): Promise<Slot[]> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { timezone: true, slotStepMinutes: true },
  })
  const day = parseYmd(ymd, business.timezone)
  if (!day) throw new BookingError("Data inválida.", "INVALID")
  const service = await prisma.service.findFirst({ where: { id: serviceId, businessId } })
  if (!service) throw new BookingError("Serviço não encontrado.", "NOT_FOUND")

  const { workingHours, exceptions, appointments } = await loadSchedule(
    businessId,
    day,
    addDays(day, 1),
    options.ignoreAppointmentId,
  )
  return getAvailableSlots(day, {
    timezone: business.timezone,
    workingHours,
    exceptions,
    appointments,
    service,
    stepMin: business.slotStepMinutes,
    now: options.now ?? new Date(),
    minNoticeMin: options.minNoticeMin ?? 0,
  })
}

/** Disponibilidade por dia do mês para o calendário do passo 2. */
export async function monthAvailability(
  businessId: string,
  serviceId: string,
  year: number,
  monthIndex: number,
  options: { ignoreAppointmentId?: string; now?: Date } = {},
): Promise<Record<string, DayAvailability>> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { timezone: true, slotStepMinutes: true },
  })
  const service = await prisma.service.findFirst({ where: { id: serviceId, businessId } })
  if (!service) throw new BookingError("Serviço não encontrado.", "NOT_FOUND")
  const start = new TZDate(year, monthIndex, 1, 0, 0, 0, business.timezone)
  const end = new TZDate(year, monthIndex + 1, 1, 0, 0, 0, business.timezone)
  const { workingHours, exceptions, appointments } = await loadSchedule(
    businessId,
    start,
    end,
    options.ignoreAppointmentId,
  )
  return getMonthAvailability(year, monthIndex, {
    timezone: business.timezone,
    workingHours,
    exceptions,
    appointments,
    service,
    stepMin: business.slotStepMinutes,
    now: options.now ?? new Date(),
  })
}

export type BookInput = {
  businessId: string
  clientId: string
  serviceId: string
  startsAt: Date
  origin: AppointmentOrigin
  status: AppointmentStatus
  note?: string | null
  /** Remarcação: id do agendamento que será movido (ignorado na checagem de conflito). */
  rescheduleId?: string
}

/**
 * Cria (ou move) um agendamento com checagem de disponibilidade dentro da transação.
 * Lança BookingError("UNAVAILABLE") quando o horário acabou de ser ocupado.
 */
export async function bookAppointment(input: BookInput) {
  const service = await prisma.service.findFirst({
    where: { id: input.serviceId, businessId: input.businessId },
  })
  if (!service) throw new BookingError("Serviço não encontrado.", "NOT_FOUND")

  const serviceEndsAt = addMinutes(input.startsAt, service.durationMin)
  const endsAt = addMinutes(serviceEndsAt, service.bufferMin)

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const business = await tx.business.findUniqueOrThrow({
            where: { id: input.businessId },
            select: { timezone: true, codePrefix: true },
          })
          const dayStart = localDayStart(input.startsAt, business.timezone)
          const dayEnd = addDays(dayStart, 1)
          const [workingHours, exceptions, appointments] = await Promise.all([
            tx.workingHours.findMany({ where: { businessId: input.businessId } }),
            tx.scheduleException.findMany({
              where: {
                businessId: input.businessId,
                endsAt: { gt: dayStart },
                startsAt: { lt: dayEnd },
              },
            }),
            tx.appointment.findMany({
              where: {
                businessId: input.businessId,
                status: { in: ACTIVE_STATUSES },
                endsAt: { gt: dayStart },
                startsAt: { lt: dayEnd },
                ...(input.rescheduleId ? { id: { not: input.rescheduleId } } : {}),
              },
              select: { startsAt: true, endsAt: true },
            }),
          ])

          const ok = isBookable(input.startsAt, endsAt, {
            timezone: business.timezone,
            workingHours,
            exceptions,
            appointments,
          })
          if (!ok)
            throw new BookingError(
              "Esse horário acabou de ser ocupado. Escolha outro.",
              "UNAVAILABLE",
            )

          if (input.rescheduleId) {
            return tx.appointment.update({
              where: { id: input.rescheduleId },
              data: {
                serviceId: service.id,
                startsAt: input.startsAt,
                serviceEndsAt,
                endsAt,
                priceCents: service.priceCents,
                note: input.note ?? undefined,
              },
            })
          }

          const count = await tx.appointment.count({ where: { businessId: input.businessId } })
          const code = `${business.codePrefix}-${2400 + count + 1}`
          return tx.appointment.create({
            data: {
              businessId: input.businessId,
              clientId: input.clientId,
              serviceId: service.id,
              code,
              startsAt: input.startsAt,
              serviceEndsAt,
              endsAt,
              status: input.status,
              origin: input.origin,
              note: input.note ?? null,
              priceCents: service.priceCents,
            },
          })
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
    } catch (error) {
      if (error instanceof BookingError) throw error
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2034" || error.code === "P2002")
      if (!retryable || attempt === 2) throw error
    }
  }
  throw new BookingError("Não foi possível reservar. Tente de novo.", "UNAVAILABLE")
}
