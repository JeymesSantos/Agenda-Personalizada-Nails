import "server-only"
import { randomUUID } from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { del, put } from "@vercel/blob"

/*
 * Armazenamento de arquivos enviados (fotos de serviços, portfólio, comprovantes,
 * mídias de fundo). Duas implementações atrás da mesma interface:
 * - disco: grava em public/uploads/<pasta>/<uuid>.<ext> e serve por /uploads/... (desenvolvimento)
 * - Vercel Blob: usado quando BLOB_READ_WRITE_TOKEN está definido (produção na Vercel)
 * Uploads grandes (vídeo) em produção vão direto do navegador para o Blob; ver
 * app/api/uploads/background/route.ts.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
}

export type UploadResult = { url: string }

export function isBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES[file.type]) return "Envie uma imagem JPG, PNG ou WebP."
  if (file.size > MAX_UPLOAD_BYTES) return "A imagem precisa ter até 5 MB."
  return null
}

export function validateVideo(file: File): string | null {
  if (!ALLOWED_VIDEO_TYPES[file.type]) return "Envie um vídeo MP4 ou WebM."
  if (file.size > MAX_VIDEO_BYTES) return "O vídeo precisa ter até 50 MB."
  return null
}

async function store(file: File, folder: string, ext: string): Promise<UploadResult> {
  const name = `${randomUUID()}.${ext}`
  if (isBlobStorage()) {
    const blob = await put(`${folder}/${name}`, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    })
    return { url: blob.url }
  }
  const dir = path.join(process.cwd(), "public", "uploads", folder)
  await mkdir(dir, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(dir, name), buffer)
  return { url: `/uploads/${folder}/${name}` }
}

export async function saveUpload(file: File, folder: string): Promise<UploadResult> {
  const error = validateImage(file)
  if (error) throw new Error(error)
  return store(file, folder, ALLOWED_IMAGE_TYPES[file.type])
}

export async function saveVideoUpload(file: File, folder: string): Promise<UploadResult> {
  const error = validateVideo(file)
  if (error) throw new Error(error)
  return store(file, folder, ALLOWED_VIDEO_TYPES[file.type])
}

/* URL gerada por este módulo (disco local ou Blob da Vercel)? Barra URLs arbitrárias vindas do cliente. */
export function isOwnUploadUrl(url: string): boolean {
  if (url.startsWith("/uploads/")) return true
  return /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url)
}

export async function deleteUpload(url: string): Promise<void> {
  if (url.startsWith("/uploads/")) {
    const file = path.join(process.cwd(), "public", url.replace(/^\//, ""))
    await unlink(file).catch(() => undefined)
    return
  }
  if (isBlobStorage() && isOwnUploadUrl(url)) {
    await del(url).catch(() => undefined)
  }
}
