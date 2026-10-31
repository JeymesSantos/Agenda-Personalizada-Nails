"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { deleteUpload, saveUpload, validateImage } from "@/lib/storage"
import { serviceSchema, type ServiceFormState } from "./schemas"

async function ownerBusiness() {
  const user = await requireAdmin()
  return prisma.business.findUniqueOrThrow({ where: { ownerId: user.id }, select: { id: true } })
}

function revalidateServices() {
  revalidatePath("/admin/servicos")
  revalidatePath("/admin")
  revalidatePath("/")
  revalidatePath("/servicos")
  revalidatePath("/agendar")
}

function parseForm(formData: FormData) {
  return serviceSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    durationMin: formData.get("durationMin"),
    bufferMin: formData.get("bufferMin"),
    price: formData.get("price"),
    priceFrom: formData.get("priceFrom") === "on",
    visible: formData.get("visible") === "on",
    photoUrls: formData.getAll("photoUrls").map(String).filter(Boolean),
  })
}

export async function saveServiceAction(
  serviceId: string | null,
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const business = await ownerBusiness()
  const parsed = parseForm(formData)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const v = parsed.data
  const data = {
    title: v.title,
    description: v.description || null,
    categoryId: v.categoryId || null,
    durationMin: v.durationMin,
    bufferMin: v.bufferMin,
    priceCents: v.price,
    priceFrom: v.priceFrom,
    visible: v.visible,
    photoUrls: v.photoUrls,
  }

  if (v.categoryId) {
    const category = await prisma.serviceCategory.findFirst({
      where: { id: v.categoryId, businessId: business.id },
    })
    if (!category) return { fieldErrors: { categoryId: ["Categoria inválida"] } }
  }

  if (serviceId) {
    const existing = await prisma.service.findFirst({
      where: { id: serviceId, businessId: business.id },
    })
    if (!existing) return { error: "Serviço não encontrado." }
    await prisma.service.update({ where: { id: serviceId }, data })
    /* fotos removidas do formulário saem do disco */
    for (const url of existing.photoUrls) {
      if (!v.photoUrls.includes(url)) await deleteUpload(url)
    }
  } else {
    const last = await prisma.service.findFirst({
      where: { businessId: business.id },
      orderBy: { order: "desc" },
      select: { order: true },
    })
    await prisma.service.create({
      data: { ...data, businessId: business.id, order: (last?.order ?? -1) + 1 },
    })
  }

  revalidateServices()
  redirect("/admin/servicos?salvo=1")
}

export async function toggleServiceVisibleAction(serviceId: string, visible: boolean) {
  const business = await ownerBusiness()
  await prisma.service.updateMany({
    where: { id: serviceId, businessId: business.id },
    data: { visible },
  })
  revalidateServices()
}

export async function moveServiceAction(serviceId: string, direction: "up" | "down") {
  const business = await ownerBusiness()
  const services = await prisma.service.findMany({
    where: { businessId: business.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  })
  const index = services.findIndex((s) => s.id === serviceId)
  const target = direction === "up" ? index - 1 : index + 1
  if (index < 0 || target < 0 || target >= services.length) return
  const reordered = [...services]
  ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
  await prisma.$transaction(
    reordered.map((s, order) => prisma.service.update({ where: { id: s.id }, data: { order } })),
  )
  revalidateServices()
}

export async function deleteServiceAction(serviceId: string): Promise<{ error?: string }> {
  const business = await ownerBusiness()
  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: business.id },
    include: { _count: { select: { appointments: true } } },
  })
  if (!service) return { error: "Serviço não encontrado." }
  if (service._count.appointments > 0) {
    await prisma.service.update({ where: { id: serviceId }, data: { visible: false } })
    revalidateServices()
    return {
      error: "Esse serviço tem agendamentos no histórico, então foi ocultado em vez de excluído.",
    }
  }
  await prisma.service.delete({ where: { id: serviceId } })
  for (const url of service.photoUrls) await deleteUpload(url)
  revalidateServices()
  return {}
}

export async function uploadServicePhotoAction(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const business = await ownerBusiness()
  const file = formData.get("file")
  if (!(file instanceof File)) return { error: "Nenhum arquivo enviado." }
  const invalid = validateImage(file)
  if (invalid) return { error: invalid }
  const { url } = await saveUpload(file, `servicos/${business.id}`)
  return { url }
}

export async function createCategoryAction(name: string): Promise<{ id?: string; error?: string }> {
  const business = await ownerBusiness()
  const trimmed = name.trim()
  if (trimmed.length < 2) return { error: "Nome muito curto." }
  const last = await prisma.serviceCategory.findFirst({
    where: { businessId: business.id },
    orderBy: { order: "desc" },
  })
  const category = await prisma.serviceCategory.upsert({
    where: { businessId_name: { businessId: business.id, name: trimmed } },
    update: {},
    create: { businessId: business.id, name: trimmed, order: (last?.order ?? -1) + 1 },
  })
  revalidateServices()
  return { id: category.id }
}
