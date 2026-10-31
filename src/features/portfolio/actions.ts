"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { deleteUpload, saveUpload, validateImage } from "@/lib/storage"

async function ownerBusiness() {
  const user = await requireAdmin()
  return prisma.business.findUniqueOrThrow({ where: { ownerId: user.id }, select: { id: true } })
}

function revalidatePortfolio() {
  revalidatePath("/admin/portfolio")
  revalidatePath("/")
  revalidatePath("/portfolio")
}

export type PortfolioResult = { error?: string; success?: string }

export async function uploadPhotosAction(
  formData: FormData,
): Promise<PortfolioResult & { ids?: string[] }> {
  const business = await ownerBusiness()
  const albumId = String(formData.get("albumId") ?? "") || null
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) return { error: "Nenhuma foto selecionada." }
  if (files.length > 20) return { error: "Envie até 20 fotos por vez." }
  for (const f of files) {
    const invalid = validateImage(f)
    if (invalid) return { error: `${f.name}: ${invalid}` }
  }
  if (albumId) {
    const album = await prisma.album.findFirst({ where: { id: albumId, businessId: business.id } })
    if (!album) return { error: "Álbum inválido." }
  }
  const last = await prisma.photo.findFirst({
    where: { businessId: business.id },
    orderBy: { order: "desc" },
    select: { order: true },
  })
  let order = (last?.order ?? -1) + 1
  const ids: string[] = []
  for (const f of files) {
    const { url } = await saveUpload(f, `portfolio/${business.id}`)
    const photo = await prisma.photo.create({
      data: { businessId: business.id, albumId, url, order: order++ },
    })
    ids.push(photo.id)
  }
  revalidatePortfolio()
  return {
    success: `${files.length} foto${files.length > 1 ? "s" : ""} enviada${files.length > 1 ? "s" : ""}.`,
    ids,
  }
}

const photoSchema = z.object({
  caption: z.string().trim().max(140, "Legenda muito longa").optional().or(z.literal("")),
  serviceId: z.string().optional().or(z.literal("")),
  albumId: z.string().optional().or(z.literal("")),
  featuredOnBio: z.coerce.boolean(),
  wantThis: z.coerce.boolean(),
})

export async function updatePhotoAction(id: string, formData: FormData): Promise<PortfolioResult> {
  const business = await ownerBusiness()
  const parsed = photoSchema.safeParse({
    caption: formData.get("caption") ?? "",
    serviceId: formData.get("serviceId") ?? "",
    albumId: formData.get("albumId") ?? "",
    featuredOnBio: formData.get("featuredOnBio") === "on",
    wantThis: formData.get("wantThis") === "on",
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  const v = parsed.data
  const photo = await prisma.photo.findFirst({ where: { id, businessId: business.id } })
  if (!photo) return { error: "Foto não encontrada." }
  if (v.serviceId) {
    const s = await prisma.service.findFirst({
      where: { id: v.serviceId, businessId: business.id },
    })
    if (!s) return { error: "Serviço inválido." }
  }
  if (v.albumId) {
    const a = await prisma.album.findFirst({ where: { id: v.albumId, businessId: business.id } })
    if (!a) return { error: "Álbum inválido." }
  }
  await prisma.photo.update({
    where: { id },
    data: {
      caption: v.caption || null,
      serviceId: v.serviceId || null,
      albumId: v.albumId || null,
      featuredOnBio: v.featuredOnBio,
      wantThis: v.wantThis,
    },
  })
  revalidatePortfolio()
  return { success: "Foto atualizada." }
}

export async function setCoverAction(id: string): Promise<PortfolioResult> {
  const business = await ownerBusiness()
  const photo = await prisma.photo.findFirst({ where: { id, businessId: business.id } })
  if (!photo) return { error: "Foto não encontrada." }
  await prisma.$transaction([
    prisma.photo.updateMany({
      where: { businessId: business.id, isCover: true },
      data: { isCover: false },
    }),
    prisma.photo.update({ where: { id }, data: { isCover: true } }),
  ])
  revalidatePortfolio()
  return { success: "Capa do portfólio definida." }
}

export async function deletePhotoAction(id: string): Promise<PortfolioResult> {
  const business = await ownerBusiness()
  const photo = await prisma.photo.findFirst({ where: { id, businessId: business.id } })
  if (!photo) return { error: "Foto não encontrada." }
  await prisma.photo.delete({ where: { id } })
  await deleteUpload(photo.url)
  revalidatePortfolio()
  return { success: "Foto excluída." }
}

export async function createAlbumAction(name: string): Promise<PortfolioResult & { id?: string }> {
  const business = await ownerBusiness()
  const trimmed = name.trim()
  if (trimmed.length < 2) return { error: "Nome do álbum muito curto." }
  const last = await prisma.album.findFirst({
    where: { businessId: business.id },
    orderBy: { order: "desc" },
  })
  const album = await prisma.album.upsert({
    where: { businessId_name: { businessId: business.id, name: trimmed } },
    update: {},
    create: { businessId: business.id, name: trimmed, order: (last?.order ?? -1) + 1 },
  })
  revalidatePortfolio()
  return { success: "Álbum criado.", id: album.id }
}

export async function deleteAlbumAction(id: string): Promise<PortfolioResult> {
  const business = await ownerBusiness()
  const album = await prisma.album.findFirst({ where: { id, businessId: business.id } })
  if (!album) return { error: "Álbum não encontrado." }
  /* fotos ficam sem álbum (onDelete: SetNull) */
  await prisma.album.delete({ where: { id } })
  revalidatePortfolio()
  return { success: "Álbum removido; as fotos continuam no portfólio." }
}
