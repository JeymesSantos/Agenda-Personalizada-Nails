/*
 * Tipos do motor de horários. Tudo aqui é puro: sem Prisma, sem rede.
 * Minutos locais = minutos desde a meia-noite do dia no fuso do estúdio.
 */

export type WorkingHoursRule = {
  /** 0 = domingo … 6 = sábado */
  weekday: number
  enabled: boolean
  startMin: number
  endMin: number
  breakStartMin?: number | null
  breakEndMin?: number | null
}

export type ScheduleExceptionRule = {
  type: "BLOCK" | "RELEASE"
  startsAt: Date
  endsAt: Date
}

export type BusyAppointment = {
  startsAt: Date
  /** Fim do bloqueio na agenda (atendimento + reorganização). */
  endsAt: Date
}

export type ServiceDuration = {
  durationMin: number
  bufferMin: number
}

/** Intervalo semiaberto [start, end) em minutos locais do dia. */
export type MinuteInterval = { start: number; end: number }

export type Slot = {
  /** Início do atendimento. */
  startsAt: Date
  /** Fim do atendimento com a cliente (sem reorganização). */
  serviceEndsAt: Date
  /** Fim do bloqueio na agenda (com reorganização). */
  endsAt: Date
  /** Minutos locais do início, útil para agrupar em Manhã/Tarde. */
  startMin: number
}

export type DayAvailability = "available" | "full" | "closed"

export type AvailabilityInput = {
  timezone: string
  workingHours: WorkingHoursRule[]
  exceptions: ScheduleExceptionRule[]
  appointments: BusyAppointment[]
  service: ServiceDuration
  /** Passo entre inícios candidatos (padrão 15 min). */
  stepMin?: number
  /** Instante atual; horários anteriores a ele são descartados. */
  now: Date
  /** Antecedência mínima em minutos em relação a `now` (padrão 0). */
  minNoticeMin?: number
}
