import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { isBlobStorage, saveVideoUpload } from "@/lib/storage"
import { MAX_CLIP_BYTES, validateClip } from "@/features/portfolio/video"

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (user?.role !== "ADMIN") return Response.json({ error: "Não autorizado." }, { status: 401 })
  const business = await prisma.business.findUniqueOrThrow({ where: { ownerId: user.id } })
  const folder = `portfolio/${business.id}`
  try {
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      if (isBlobStorage())
        return Response.json({ error: "Use o envio direto neste ambiente." }, { status: 400 })
      if (Number(request.headers.get("content-length")) > MAX_CLIP_BYTES + 65536)
        return Response.json({ error: "O vídeo precisa ter até 20 MB." }, { status: 413 })
      const form = await request.formData()
      const file = form.get("file")
      if (!(file instanceof File) || file.type !== "video/mp4" || file.size > MAX_CLIP_BYTES)
        return Response.json({ error: "Envie um MP4 de até 20 MB." }, { status: 400 })
      const invalid = validateClip(new Uint8Array(await file.arrayBuffer()))
      if (invalid) return Response.json({ error: invalid }, { status: 400 })
      return Response.json(await saveVideoUpload(file, folder))
    }
    if (!isBlobStorage())
      return Response.json({ error: "Upload direto indisponível." }, { status: 400 })
    const body = (await request.json()) as HandleUploadBody
    return Response.json(
      await handleUpload({
        request,
        body,
        onBeforeGenerateToken: async (pathname) => {
          if (!pathname.startsWith(`${folder}/`)) throw new Error("Caminho inválido.")
          return {
            allowedContentTypes: ["video/mp4"],
            maximumSizeInBytes: MAX_CLIP_BYTES,
            addRandomSuffix: true,
          }
        },
        onUploadCompleted: async () => {},
      }),
    )
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha no upload." },
      { status: 400 },
    )
  }
}
