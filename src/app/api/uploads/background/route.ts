import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  isBlobStorage,
  MAX_VIDEO_BYTES,
  saveUpload,
  saveVideoUpload,
} from "@/lib/storage"

/*
 * Upload das mídias de fundo (foto, vídeo e pôster). Fica fora das Server
 * Actions porque elas limitam o corpo a 1 MB e um vídeo chega a 50 MB.
 *
 * - multipart/form-data (`file` + `kind`): grava pelo storage do servidor.
 *   É o caminho em desenvolvimento (disco) e fora da Vercel.
 * - JSON: protocolo de client upload do Vercel Blob. Em produção o arquivo vai
 *   do navegador direto para o Blob (funções da Vercel aceitam só 4,5 MB de
 *   corpo); esta rota só emite o token e confere o tipo/tamanho.
 *
 * A rota só entrega a URL; o registro no banco é feito pela Server Action
 * `createBackgroundMediaAction`, que confere a URL com `isOwnUploadUrl`.
 */

async function requireAdminBusiness() {
  const user = await getCurrentUser()
  if (user?.role !== "ADMIN") return null
  return prisma.business.findUnique({ where: { ownerId: user.id }, select: { id: true } })
}

export async function POST(request: Request) {
  const business = await requireAdminBusiness()
  if (!business) return Response.json({ error: "Não autorizado." }, { status: 401 })

  const folder = `backgrounds/${business.id}`
  const contentType = request.headers.get("content-type") ?? ""

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData()
    const file = form.get("file")
    const kind = form.get("kind")
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "Nenhum arquivo enviado." }, { status: 400 })
    }
    try {
      const { url } =
        kind === "video" ? await saveVideoUpload(file, folder) : await saveUpload(file, folder)
      return Response.json({ url })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha ao salvar o arquivo."
      return Response.json({ error: message }, { status: 400 })
    }
  }

  if (!isBlobStorage()) {
    return Response.json({ error: "Upload direto indisponível neste ambiente." }, { status: 400 })
  }

  const body = (await request.json()) as HandleUploadBody
  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(`${folder}/`)) throw new Error("Caminho inválido.")
        return {
          allowedContentTypes: [
            ...Object.keys(ALLOWED_IMAGE_TYPES),
            ...Object.keys(ALLOWED_VIDEO_TYPES),
          ],
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async () => {
        /* o registro é criado pela Server Action depois do upload */
      },
    })
    return Response.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Falha no upload."
    return Response.json({ error: message }, { status: 400 })
  }
}
