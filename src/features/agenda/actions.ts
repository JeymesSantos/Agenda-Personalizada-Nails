"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import type { AppointmentStatus } from "@/generated/prisma/enums"
import { whatsappSchema } from "@/features/auth/schemas"
import { BookingError, bookAppointment, slotsForDay } from "@/features/booking/core"
import { cancelReminders, scheduleReminders } from "@/features/reminders/core"
import { fmtTime } from "@/lib/dates"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { searchClients } from "./queries"

async function ownerBusiness() {
  const user = await requireAdmin()
  return prisma.business.findUniqueOrThrow({
    where: { ownerId: user.id },
    select: { id: true, timezone: true },
  })
}

function revalidateAgenda() {
  revalidatePath("/admin/agenda")
  revalidatePath("/admin")
  revalidatePath("/admin/clientes")
  revalidatePath("/meus-horarios")
  revalidatePath("/agendar")
}

export type ActionResult = { error?: string; success?: string }

const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "DONE", "NO_SHOW"],
  CONFIRMED: ["DONE", "NO_SHOW", "CANCELLED", "PENDING"],
  DONE: ["CONFIRMED"],
  NO_SHOW: ["CONFIRMED"],
  CANCELLED: ["CONFIRMED"],
}

export async function setAppointmentStatusAction(
  id: string,
  status: AppointmentStatus,
): Promise<ActionResult> {
  const business = await ownerBusiness()
  const a = await prisma.appointment.findFirst({ where: { id, businessId: business.id } })
  if (!a) return { error: "Agendamento não encontrado." }
  if (!transitions[a.status].includes(status))
    return { error: "Essa mudança de status não é permitida." }
  await prisma.appointment.update({
    where: { id },
    data: {
      status,
      cancelledAt: status === "CANCELLED" ? new Date() : null,
      cancelledBy: status === "CANCELLED" ? "ADMIN" : null,
    },
  })
  /* lembretes só fazem sentido para agendamento ativo; reabrir volta a agendá-los */
  if (status === "PENDING" || status === "CONFIRMED") await scheduleReminders(id)
  else await cancelReminders(id)
  revalidateAgenda()
  const labels: Record<AppointmentStatus, string> = {
    PENDING: "Marcado como pendente.",
    CONFIRMED: "Agendamento confirmado.",
    DONE: "Atendimento concluído.",
    NO_SHOW: "Falta registrada.",
    CANCELLED: "Agendamento cancelado.",
  }
  return { success: labels[status] }
}

export async function updateAppointmentNoteAction(id: string, note: string): Promise<ActionResult> {
  const business = await ownerBusiness()
  await prisma.appointment.updateMany({
    where: { id, businessId: business.id },
    data: { note: note.trim() || null },
  })
  revalidateAgenda()
  return { success: "Observação salva." }
}

export type SlotOption = { iso: string; label: string; endLabel: string }

export async function getSlotsAction(
  serviceId: string,
  ymd: string,
  ignoreAppointmentId?: string,
): Promise<{ slots?: SlotOption[]; error?: string }> {
  const business = await ownerBusiness()
  try {
    const slots = await slotsForDay(business.id, serviceId, ymd, { ignoreAppointmentId })
    return {
      slots: slots.map((s) => ({
        iso: s.startsAt.toISOString(),
        label: fmtTime(s.startsAt, business.timezone),
        endLabel: fmtTime(s.serviceEndsAt, business.timezone),
      })),
    }
  } catch (error) {
    if (error instanceof BookingError) return { error: error.message }
    throw error
  }
}

export async function searchClientsAction(q: string) {
  const business = await ownerBusiness()
  const rows = await searchClients(business.id, q)
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    whatsapp: r.whatsapp,
    registered: Boolean(r.passwordHash),
  }))
}

const createSchema = z.object({
  serviceId: z.string().min(1, "Escolha o serviço"),
  startsAt: z.string().datetime({ message: "Escolha um horário" }),
  note: z.string().trim().max(300).optional().or(z.literal("")),
  clientId: z.string().optional().or(z.literal("")),
  clientName: z.string().trim().optional().or(z.literal("")),
  clientWhatsapp: z.string().optional().or(z.literal("")),
})

export async function createAppointmentAction(
  formData: FormData,
): Promise<ActionResult & { id?: string }> {
  const business = await ownerBusiness()
  const parsed = createSchema.safeParse({
    serviceId: formData.get("serviceId"),
    startsAt: formData.get("startsAt"),
    note: formData.get("note") ?? "",
    clientId: formData.get("clientId") ?? "",
    clientName: formData.get("clientName") ?? "",
    clientWhatsapp: formData.get("clientWhatsapp") ?? "",
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  const v = parsed.data

  let clientId = v.clientId || ""
  if (!clientId) {
    if (!v.clientName || v.clientName.length < 2) return { error: "Informe o nome da cliente." }
    const wa = whatsappSchema.safeParse(v.clientWhatsapp ?? "")
    if (!wa.success) return { error: wa.error.issues[0]?.message ?? "WhatsApp inválido." }
    const existing = await prisma.user.findUnique({ where: { whatsapp: wa.data } })
    if (existing) {
      clientId = existing.id
    } else {
      const created = await prisma.user.create({
        data: { name: v.clientName, whatsapp: wa.data, role: "CLIENT" },
      })
      clientId = created.id
    }
  }

  try {
    const a = await bookAppointment({
      businessId: business.id,
      clientId,
      serviceId: v.serviceId,
      startsAt: new Date(v.startsAt),
      origin: "ADMIN",
      status: "CONFIRMED",
      note: v.note || null,
    })
    revalidateAgenda()
    return { success: `Agendamento ${a.code} criado.`, id: a.id }
  } catch (error) {
    if (error instanceof BookingError) return { error: error.message }
    throw error
  }
}

export async function rescheduleAppointmentAction(
  id: string,
  serviceId: string,
  startsAtIso: string,
): Promise<ActionResult> {
  const business = await ownerBusiness()
  const a = await prisma.appointment.findFirst({ where: { id, businessId: business.id } })
  if (!a) return { error: "Agendamento não encontrado." }
  if (a.status === "CANCELLED" || a.status === "DONE")
    return { error: "Esse agendamento não pode ser remarcado." }
  try {
    await bookAppointment({
      businessId: business.id,
      clientId: a.clientId,
      serviceId,
      startsAt: new Date(startsAtIso),
      origin: a.origin,
      status: a.status,
      rescheduleId: id,
    })
    revalidateAgenda()
    return { success: "Agendamento remarcado." }
  } catch (error) {
    if (error instanceof BookingError) return { error: error.message }
    throw error
  }
}
