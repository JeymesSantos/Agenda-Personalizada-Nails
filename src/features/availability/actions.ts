"use server"

import { TZDate } from "@date-fns/tz"
import { addDays, addMonths } from "date-fns"
import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { countActiveAppointmentsInRange } from "./queries"
import {
  exceptionSchema,
  timeToMinutes,
  workingHoursSchema,
  type AvailabilityFormState,
} from "./schemas"

async function ownerBusiness() {
  const user = await requireAdmin()
  return prisma.business.findUniqueOrThrow({
    where: { ownerId: user.id },
    select: { id: true, timezone: true },
  })
}

function revalidateAvailability() {
  revalidatePath("/admin/disponibilidade")
  revalidatePath("/admin/agenda")
  revalidatePath("/admin")
  revalidatePath("/agendar")
}

/* ---------- horário de funcionamento ---------- */

export async function saveWorkingHoursAction(
  _prev: AvailabilityFormState,
  formData: FormData,
): Promise<AvailabilityFormState> {
  const business = await ownerBusiness()
  const days = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    enabled: formData.get(`d${weekday}.enabled`) === "on",
    start: String(formData.get(`d${weekday}.start`) ?? "09:00"),
    end: String(formData.get(`d${weekday}.end`) ?? "19:00"),
    breakStart: String(formData.get(`d${weekday}.breakStart`) ?? ""),
    breakEnd: String(formData.get(`d${weekday}.breakEnd`) ?? ""),
  }))
  const parsed = workingHoursSchema.safeParse(days)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const [index, field] = issue.path
      fieldErrors[`d${String(index)}.${String(field)}`] = [issue.message]
    }
    return { fieldErrors }
  }

  await prisma.$transaction(
    parsed.data.map((d) =>
      prisma.workingHours.upsert({
        where: { businessId_weekday: { businessId: business.id, weekday: d.weekday } },
        update: {
          enabled: d.enabled,
          startMin: timeToMinutes(d.start),
          endMin: timeToMinutes(d.end),
          breakStartMin: d.breakStart ? timeToMinutes(d.breakStart) : null,
          breakEndMin: d.breakEnd ? timeToMinutes(d.breakEnd) : null,
        },
        create: {
          businessId: business.id,
          weekday: d.weekday,
          enabled: d.enabled,
          startMin: timeToMinutes(d.start),
          endMin: timeToMinutes(d.end),
          breakStartMin: d.breakStart ? timeToMinutes(d.breakStart) : null,
          breakEndMin: d.breakEnd ? timeToMinutes(d.breakEnd) : null,
        },
      }),
    ),
  )
  revalidateAvailability()
  return { success: "Horário de funcionamento salvo." }
}

/* ---------- bloqueios e liberações ---------- */

function toRange(
  d: {
    mode: "month" | "days" | "range"
    month?: string
    startDate?: string
    endDate?: string
    startTime?: string
    endTime?: string
  },
  timezone: string,
): { startsAt: Date; endsAt: Date; allDay: boolean } {
  const local = (ymd: string, min = 0) => {
    const [y, m, day] = ymd.split("-").map(Number)
    return new TZDate(y, m - 1, day, Math.floor(min / 60), min % 60, 0, timezone)
  }
  if (d.mode === "month") {
    const [y, m] = d.month!.split("-").map(Number)
    const start = new TZDate(y, m - 1, 1, 0, 0, 0, timezone)
    return { startsAt: start, endsAt: addMonths(start, 1), allDay: true }
  }
  if (d.mode === "days") {
    const start = local(d.startDate!)
    const end = addDays(local(d.endDate || d.startDate!), 1)
    return { startsAt: start, endsAt: end, allDay: true }
  }
  return {
    startsAt: local(d.startDate!, timeToMinutes(d.startTime!)),
    endsAt: local(d.startDate!, timeToMinutes(d.endTime!)),
    allDay: false,
  }
}

function parseException(formData: FormData) {
  return exceptionSchema.safeParse({
    type: formData.get("type"),
    mode: formData.get("mode"),
    month: formData.get("month") ?? "",
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") ?? "",
    startTime: formData.get("startTime") ?? "",
    endTime: formData.get("endTime") ?? "",
    reason: formData.get("reason") ?? "",
  })
}

/** Prévia para o modal: quantos agendamentos ativos cruzam o período. */
export async function previewExceptionAction(
  formData: FormData,
): Promise<{ count?: number; error?: string }> {
  const business = await ownerBusiness()
  const parsed = parseException(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Período inválido" }
  const { startsAt, endsAt } = toRange(parsed.data, business.timezone)
  const count = await countActiveAppointmentsInRange(business.id, startsAt, endsAt)
  return { count }
}

export async function createExceptionAction(
  _prev: AvailabilityFormState,
  formData: FormData,
): Promise<AvailabilityFormState> {
  const business = await ownerBusiness()
  const parsed = parseException(formData)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const { startsAt, endsAt, allDay } = toRange(parsed.data, business.timezone)
  await prisma.scheduleException.create({
    data: {
      businessId: business.id,
      type: parsed.data.type,
      startsAt,
      endsAt,
      allDay,
      reason: parsed.data.reason || null,
    },
  })
  revalidateAvailability()
  return { success: parsed.data.type === "BLOCK" ? "Bloqueio aplicado." : "Horário liberado." }
}

export async function deleteExceptionAction(id: string) {
  const business = await ownerBusiness()
  await prisma.scheduleException.deleteMany({ where: { id, businessId: business.id } })
  revalidateAvailability()
}
