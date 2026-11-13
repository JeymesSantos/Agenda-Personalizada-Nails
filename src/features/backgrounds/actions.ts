"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { BackgroundPage, BackgroundVeil } from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { deleteUpload, isOwnUploadUrl } from "@/lib/storage"

async function ownerBusiness() {
  const user = await requireAdmin()
  return prisma.business.findUniqueOrThrow({ where: { ownerId: user.id }, select: { id: true } })
}

/* o fundo aparece em todas as telas: invalida o app inteiro */
function revalidateBackgrounds() {
  revalidatePath("/", "layout")
}

export type BackgroundResult = { error?: string; success?: string }

const ownUrl = z.string().trim().min(1).refine(isOwnUploadUrl, "URL de arquivo inválida.")

const createSchema = z.object({
  kind: z.enum(["IMAGE", "VIDEO"]),
  url: ownUrl,
  posterUrl: ownUrl.optional().or(z.literal("")),
  name: z.string().trim().min(1, "Dê um nome à mídia.").max(60, "Nome muito longo."),
})

/*
 * Registra uma mídia já enviada pela rota /api/uploads/background. A URL é
 * conferida com isOwnUploadUrl para não aceitar endereços arbitrários.
 */
export async function createBackgroundMediaAction(input: {
  kind: "IMAGE" | "VIDEO"
  url: string
  posterUrl?: string
  name: string
}): Promise<BackgroundResult & { id?: string }> {
  const business = await ownerBusiness()
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  const v = parsed.data
  const last = await prisma.backgroundMedia.findFirst({
    where: { businessId: business.id },
    orderBy: { order: "desc" },
    select: { order: true },
  })
  const media = await prisma.backgroundMedia.create({
    data: {
      businessId: business.id,
      kind: v.kind,
      url: v.url,
      posterUrl: v.kind === "VIDEO" && v.posterUrl ? v.posterUrl : null,
      name: v.name,
      order: (last?.order ?? -1) + 1,
    },
  })
  revalidateBackgrounds()
  return { success: v.kind === "VIDEO" ? "Vídeo adicionado." : "Foto adicionada.", id: media.id }
}

export async function renameBackgroundMediaAction(
  id: string,
  name: string,
): Promise<BackgroundResult> {
  const business = await ownerBusiness()
  const trimmed = name.trim()
  if (trimmed.length < 1 || trimmed.length > 60) return { error: "Nome inválido." }
  const r = await prisma.backgroundMedia.updateMany({
    where: { id, businessId: business.id },
    data: { name: trimmed },
  })
  if (r.count === 0) return { error: "Mídia não encontrada." }
  revalidateBackgrounds()
  return { success: "Nome atualizado." }
}

/* Apaga o registro (as atribuições caem em cascata) e os arquivos. */
export async function deleteBackgroundMediaAction(id: string): Promise<BackgroundResult> {
  const business = await ownerBusiness()
  const media = await prisma.backgroundMedia.findFirst({ where: { id, businessId: business.id } })
  if (!media) return { error: "Mídia não encontrada." }
  await prisma.backgroundMedia.delete({ where: { id } })
  await deleteUpload(media.url)
  if (media.posterUrl) await deleteUpload(media.posterUrl)
  revalidateBackgrounds()
  return { success: "Mídia excluída." }
}

const pageSchema = z.enum(Object.values(BackgroundPage) as [BackgroundPage, ...BackgroundPage[]])
const veilSchema = z.enum(Object.values(BackgroundVeil) as [BackgroundVeil, ...BackgroundVeil[]])

/* Substitui a lista de mídias de uma tela pela ordem recebida. Lista vazia = herda o padrão da área. */
export async function setPageMediaAction(
  page: BackgroundPage,
  mediaIds: string[],
): Promise<BackgroundResult> {
  const business = await ownerBusiness()
  const parsed = z.object({ page: pageSchema, mediaIds: z.array(z.string()).max(20) }).safeParse({
    page,
    mediaIds,
  })
  if (!parsed.success) return { error: "Dados inválidos." }
  const ids = Array.from(new Set(parsed.data.mediaIds))
  if (ids.length > 0) {
    const owned = await prisma.backgroundMedia.count({
      where: { id: { in: ids }, businessId: business.id },
    })
    if (owned !== ids.length) return { error: "Mídia inválida." }
  }
  await prisma.$transaction([
    prisma.backgroundAssignment.deleteMany({ where: { businessId: business.id, page } }),
    ...(ids.length > 0
      ? [
          prisma.backgroundAssignment.createMany({
            data: ids.map((mediaId, order) => ({ businessId: business.id, mediaId, page, order })),
          }),
        ]
      : []),
  ])
  revalidateBackgrounds()
  return { success: "Fundo da tela atualizado." }
}

export async function setPageVeilAction(
  page: BackgroundPage,
  veil: BackgroundVeil,
): Promise<BackgroundResult> {
  const business = await ownerBusiness()
  const parsed = z.object({ page: pageSchema, veil: veilSchema }).safeParse({ page, veil })
  if (!parsed.success) return { error: "Dados inválidos." }
  await prisma.backgroundPageSetting.upsert({
    where: { businessId_page: { businessId: business.id, page } },
    update: { veil },
    create: { businessId: business.id, page, veil },
  })
  revalidateBackgrounds()
  return { success: "Véu atualizado." }
}
