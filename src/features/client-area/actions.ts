"use server"

import { revalidatePath } from "next/cache"

import { BookingError, bookAppointment } from "@/features/booking/core"
import { cancelReminders } from "@/features/reminders/core"
import { prisma } from "@/lib/prisma"
import { canChange, getMyAppointment, resolveClientAccess } from "./queries"

export type ClientActionResult = { error?: string; success?: string }

function revalidateClientArea() {
  revalidatePath("/meus-horarios")
  revalidatePath("/admin")
  revalidatePath("/admin/agenda")
  revalidatePath("/")
}

export async function cancelMyAppointmentAction(
  id: string,
  token: string | null,
): Promise<ClientActionResult> {
  const access = await resolveClientAccess(token)
  const a = await getMyAppointment(id, access)
  if (!a) return { error: "Agendamento não encontrado." }
  if (a.status !== "PENDING" && a.status !== "CONFIRMED")
    return { error: "Esse agendamento não pode mais ser cancelado." }
  const now = new Date()
  if (!canChange(a.startsAt, a.business.cancelMinHours, now)) {
    return {
      error: `O cancelamento gratuito vale até ${a.business.cancelMinHours} h antes. Fale com a ${a.business.name.split(" ")[0]} no WhatsApp.`,
    }
  }
  await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED", cancelledAt: now, cancelledBy: "CLIENT" },
  })
  await cancelReminders(id)
  revalidateClientArea()
  return { success: "Agendamento cancelado." }
}

export async function rescheduleMyAppointmentAction(
  id: string,
  token: string | null,
  serviceId: string,
  startsAtIso: string,
): Promise<ClientActionResult> {
  const access = await resolveClientAccess(token)
  const a = await getMyAppointment(id, access)
  if (!a) return { error: "Agendamento não encontrado." }
  if (a.status !== "PENDING" && a.status !== "CONFIRMED")
    return { error: "Esse agendamento não pode mais ser alterado." }
  const now = new Date()
  if (!canChange(a.startsAt, a.business.cancelMinHours, now)) {
    return {
      error: `Alterações gratuitas valem até ${a.business.cancelMinHours} h antes. Fale com a ${a.business.name.split(" ")[0]} no WhatsApp.`,
    }
  }
  const startsAt = new Date(startsAtIso)
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < now.getTime())
    return { error: "Escolha um horário válido." }
  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: a.businessId, visible: true },
  })
  if (!service) return { error: "Serviço indisponível." }
  try {
    await bookAppointment({
      businessId: a.businessId,
      clientId: a.clientId,
      serviceId: service.id,
      startsAt,
      origin: a.origin,
      status: a.status,
      rescheduleId: a.id,
    })
  } catch (error) {
    if (error instanceof BookingError) return { error: error.message }
    throw error
  }
  revalidateClientArea()
  return { success: "Horário remarcado." }
}
