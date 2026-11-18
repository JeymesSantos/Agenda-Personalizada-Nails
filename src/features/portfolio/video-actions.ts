"use server"

import { readFile } from "node:fs/promises"
import path from "node:path"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { isOwnUploadUrl } from "@/lib/storage"
import { isPortfolioVideo, MAX_CLIP_BYTES, validateClip } from "./video"

export async function registerVideoAction(url: string, albumId: string | null) {
  const user = await requireAdmin()
  const business = await prisma.business.findUniqueOrThrow({ where: { ownerId: user.id } })
  const pathname = new URL(url, "https://local.invalid").pathname
  if (
    !isOwnUploadUrl(url) ||
    !isPortfolioVideo(url) ||
    (!pathname.startsWith(`/portfolio/${business.id}/`) &&
      !pathname.startsWith(`/uploads/portfolio/${business.id}/`)) ||
    pathname.includes("%")
  )
    return { error: "Arquivo inválido." }
  if (
    albumId &&
    !(await prisma.album.findFirst({ where: { id: albumId, businessId: business.id } }))
  )
    return { error: "Álbum inválido." }
  try {
    let bytes: Uint8Array
    if (url.startsWith("/uploads/")) {
      bytes = await readFile(path.join(process.cwd(), "public", pathname))
    } else {
      const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15000) })
      if (!response.ok || Number(response.headers.get("content-length")) > MAX_CLIP_BYTES)
        return { error: "Não foi possível validar o arquivo." }
      // Bound the download even when the storage omits Content-Length.
      const reader = response.body!.getReader()
      const chunks: Uint8Array[] = []
      let size = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > MAX_CLIP_BYTES) {
          await reader.cancel()
          return { error: "O vídeo precisa ter até 20 MB." }
        }
        chunks.push(value)
      }
      bytes = Buffer.concat(chunks)
    }
    const invalid = validateClip(bytes)
    if (invalid) return { error: invalid }
    const existing = await prisma.photo.findFirst({ where: { businessId: business.id, url } })
    if (existing) return { id: existing.id }
    const last = await prisma.photo.findFirst({
      where: { businessId: business.id },
      orderBy: { order: "desc" },
    })
    const video = await prisma.photo.create({
      data: { businessId: business.id, url, albumId, order: (last?.order ?? -1) + 1 },
    })
    revalidatePath("/admin/portfolio")
    revalidatePath("/portfolio")
    revalidatePath("/")
    return { id: video.id }
  } catch {
    return { error: "Não foi possível validar e salvar o vídeo. Tente novamente." }
  }
}
