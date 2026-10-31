import "server-only"
import { randomUUID } from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

/*
 * Armazenamento de arquivos enviados (fotos de serviços, portfólio, comprovantes).
 * Em desenvolvimento grava em public/uploads/<pasta>/<uuid>.<ext> e serve pela URL /uploads/...
 * Em produção (Vercel) a implementação será o Vercel Blob (commit D5); a interface é a mesma.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export type UploadResult = { url: string }

export function validateImage(file: File): string | null {
  if (!ALLOWED[file.type]) return "Envie uma imagem JPG, PNG ou WebP."
  if (file.size > MAX_UPLOAD_BYTES) return "A imagem precisa ter até 5 MB."
  return null
}

export async function saveUpload(file: File, folder: string): Promise<UploadResult> {
  const error = validateImage(file)
  if (error) throw new Error(error)
  const ext = ALLOWED[file.type]
  const name = `${randomUUID()}.${ext}`
  const dir = path.join(process.cwd(), "public", "uploads", folder)
  await mkdir(dir, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(dir, name), buffer)
  return { url: `/uploads/${folder}/${name}` }
}

export async function deleteUpload(url: string): Promise<void> {
  if (!url.startsWith("/uploads/")) return
  const file = path.join(process.cwd(), "public", url.replace(/^\//, ""))
  await unlink(file).catch(() => undefined)
}
