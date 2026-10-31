"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { whatsappSchema } from "@/features/auth/schemas"
import { getPublicBusinessOrThrow } from "@/features/public/queries"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { BookingError, bookAppointment } from "./core"

export type PublicBookingState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  values?: Record<string, string>
}

const guestSchema = z.object({
  serviceId: z.string().min(1),
  startsAt: z.string().datetime({ message: "Horário inválido" }),
  name: z.string().trim().min(2, "Como podemos te chamar?").max(80),
  whatsapp: whatsappSchema,
  note: z.string().trim().max(300, "Observação muito longa").optional().or(z.literal("")),
})

const memberSchema = z.object({
  serviceId: z.string().min(1),
  startsAt: z.string().datetime({ message: "Horário inválido" }),
  whatsapp: whatsappSchema.optional().or(z.literal("")),
  note: z.string().trim().max(300, "Observação muito longa").optional().or(z.literal("")),
})

function revalidateBooking() {
  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/admin/agenda")
  revalidatePath("/meus-horarios")
}

/**
 * Passo 3: cria o agendamento da cliente (com conta ou sem cadastro).
 * Sem cadastro: localiza/cria a cliente pelo WhatsApp. Redireciona para o comprovante.
 */
export async function createPublicBookingAction(
  _prev: PublicBookingState,
  formData: FormData,
): Promise<PublicBookingState> {
  const business = await getPublicBusinessOrThrow()
  const user = await getCurrentUser()
  const values = {
    name: String(formData.get("name") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    note: String(formData.get("note") ?? ""),
  }

  let clientId: string
  let serviceId: string
  let startsAt: Date
  let note: string | null

  if (user?.role === "CLIENT") {
    const parsed = memberSchema.safeParse({
      serviceId: formData.get("serviceId"),
      startsAt: formData.get("startsAt"),
      whatsapp: formData.get("whatsapp") ?? "",
      note: formData.get("note") ?? "",
    })
    if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values }
    const me = await prisma.user.findUnique({ where: { id: user.id } })
    if (!me) return { error: "Sessão inválida. Entre de novo." }
    if (!me.whatsapp && !parsed.data.whatsapp) {
      return {
        fieldErrors: { whatsapp: ["Informe seu WhatsApp para receber a confirmação"] },
        values,
      }
    }
    if (parsed.data.whatsapp && parsed.data.whatsapp !== me.whatsapp) {
      const taken = await prisma.user.findFirst({
        where: { whatsapp: parsed.data.whatsapp, id: { not: me.id } },
      })
      if (!taken)
        await prisma.user.update({ where: { id: me.id }, data: { whatsapp: parsed.data.whatsapp } })
    }
    clientId = me.id
    serviceId = parsed.data.serviceId
    startsAt = new Date(parsed.data.startsAt)
    note = parsed.data.note || null
  } else {
    const parsed = guestSchema.safeParse({
      serviceId: formData.get("serviceId"),
      startsAt: formData.get("startsAt"),
      name: formData.get("name"),
      whatsapp: formData.get("whatsapp"),
      note: formData.get("note") ?? "",
    })
    if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values }
    const existing = await prisma.user.findUnique({ where: { whatsapp: parsed.data.whatsapp } })
    if (existing) {
      clientId = existing.id
      if (!existing.passwordHash && existing.name !== parsed.data.name) {
        await prisma.user.update({ where: { id: existing.id }, data: { name: parsed.data.name } })
      }
    } else {
      const created = await prisma.user.create({
        data: { name: parsed.data.name, whatsapp: parsed.data.whatsapp, role: "CLIENT" },
      })
      clientId = created.id
    }
    serviceId = parsed.data.serviceId
    startsAt = new Date(parsed.data.startsAt)
    note = parsed.data.note || null
  }

  if (startsAt.getTime() < Date.now())
    return { error: "Esse horário já passou. Escolha outro.", values }

  let code: string
  let token: string
  try {
    const a = await bookAppointment({
      businessId: business.id,
      clientId,
      serviceId,
      startsAt,
      origin: "CLIENT",
      status: "CONFIRMED",
      note,
    })
    code = a.code
    token = a.manageToken
  } catch (error) {
    if (error instanceof BookingError) return { error: error.message, values }
    throw error
  }
  revalidateBooking()
  redirect(`/agendamento/${code}?t=${token}`)
}
