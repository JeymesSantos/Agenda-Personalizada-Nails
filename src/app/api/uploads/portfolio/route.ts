import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"

import {
  MAX_PHOTO_BYTES,
  PHOTO_TYPES,
  validatePortfolioFiles,
} from "@/features/portfolio/upload-validation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { isBlobStorage, saveUpload } from "@/lib/storage"

// Os arquivos passam pela rota local ou vão direto ao Blob, fora das Server Actions.
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (user?.role !== "ADMIN") return Response.json({ error: "Não autorizado." }, { status: 401 })
  const business = await prisma.business.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  })
  if (!business) return Response.json({ error: "Não autorizado." }, { status: 401 })
  const folder = `portfolio/${business.id}`

  try {
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const length = Number(request.headers.get("content-length"))
      if (length > MAX_PHOTO_BYTES + 64 * 1024) {
        return Response.json({ error: "A imagem precisa ter até 5 MB." }, { status: 413 })
      }
      const form = await request.formData()
      const file = form.get("file")
      if (!(file instanceof File)) {
        return Response.json({ error: "Nenhuma foto selecionada." }, { status: 400 })
      }
      const error = validatePortfolioFiles([file])
      if (error) return Response.json({ error }, { status: 400 })
      return Response.json(await saveUpload(file, folder))
    }

    if (!isBlobStorage()) {
      return Response.json({ error: "Upload direto indisponível." }, { status: 400 })
    }
    const body = (await request.json()) as HandleUploadBody
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(`${folder}/`) || pathname.includes("..")) {
          throw new Error("Caminho inválido.")
        }
        return {
          allowedContentTypes: PHOTO_TYPES,
          maximumSizeInBytes: MAX_PHOTO_BYTES,
          addRandomSuffix: true,
        }
      },
    })
    return Response.json(result)
  } catch {
    return Response.json(
      { error: "Não foi possível enviar a foto. Tente novamente." },
      { status: 400 },
    )
  }
}
