"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { deleteUpload, isOwnUploadUrl } from "@/lib/storage"

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

export async function registerPortfolioPhotoAction(input: {
  url: string
  albumId: string | null
}): Promise<PortfolioResult & { id?: string }> {
  const business = await ownerBusiness()
  const parsed = z
    .object({ url: z.string().max(2048), albumId: z.string().nullable() })
    .safeParse(input)
  if (!parsed.success) return { error: "Dados inválidos." }
  const { url, albumId } = parsed.data
  if (!isOwnUploadUrl(url) || url.includes("..") || url.includes("\\")) {
    return { error: "URL de foto inválida." }
  }
  const pathname = new URL(url, "http://localhost").pathname
  const prefix = url.startsWith("/uploads/") ? "/uploads/" : "/"
  if (!pathname.startsWith(`${prefix}portfolio/${business.id}/`)) {
    return { error: "URL de foto inválida." }
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
  const photo = await prisma.photo.create({
    data: { businessId: business.id, albumId, url, order: (last?.order ?? -1) + 1 },
  })
  revalidatePortfolio()
  return { success: "Foto enviada.", id: photo.id }
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
