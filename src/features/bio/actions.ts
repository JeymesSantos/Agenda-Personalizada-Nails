"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { deleteUpload, saveUpload, validateImage } from "@/lib/storage"
import { bioSchema, type BioFormState } from "./schemas"

async function ownerBusiness() {
  const user = await requireAdmin()
  return prisma.business.findUniqueOrThrow({ where: { ownerId: user.id } })
}

export async function saveBioAction(
  _prev: BioFormState,
  formData: FormData,
): Promise<BioFormState> {
  const business = await ownerBusiness()
  const get = (k: string) => String(formData.get(k) ?? "")
  const parsed = bioSchema.safeParse({
    name: get("name"),
    slug: get("slug"),
    tagline: get("tagline"),
    description: get("description"),
    instagram: get("instagram"),
    whatsapp: get("whatsapp"),
    addressLine: get("addressLine"),
    neighborhood: get("neighborhood"),
    hoursSummary: get("hoursSummary"),
    statsAppointments: get("statsAppointments"),
    statsRating: get("statsRating"),
    logoUrl: get("logoUrl"),
    photoUrl: get("photoUrl"),
    cancelMinHours: get("cancelMinHours") || "24",
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const v = parsed.data

  const slugTaken = await prisma.business.findFirst({
    where: { slug: v.slug, id: { not: business.id } },
  })
  if (slugTaken) return { fieldErrors: { slug: ["Esse endereço já está em uso"] } }

  await prisma.business.update({
    where: { id: business.id },
    data: {
      name: v.name,
      slug: v.slug,
      tagline: v.tagline || null,
      description: v.description || null,
      instagram: v.instagram || null,
      whatsapp: v.whatsapp || null,
      addressLine: v.addressLine || null,
      neighborhood: v.neighborhood || null,
      hoursSummary: v.hoursSummary || null,
      statsAppointments: v.statsAppointments || null,
      statsRating: v.statsRating || null,
      logoUrl: v.logoUrl || null,
      photoUrl: v.photoUrl || null,
      cancelMinHours: v.cancelMinHours,
    },
  })
  if (business.photoUrl && business.photoUrl !== (v.photoUrl || null))
    await deleteUpload(business.photoUrl)
  if (business.logoUrl?.startsWith("/uploads/") && business.logoUrl !== (v.logoUrl || null))
    await deleteUpload(business.logoUrl)

  revalidatePath("/")
  revalidatePath("/admin/bio")
  revalidatePath("/admin")
  return { success: "Página pública atualizada." }
}

export async function uploadBioImageAction(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const business = await ownerBusiness()
  const file = formData.get("file")
  if (!(file instanceof File)) return { error: "Nenhum arquivo enviado." }
  const invalid = validateImage(file)
  if (invalid) return { error: invalid }
  const { url } = await saveUpload(file, `bio/${business.id}`)
  return { url }
}
