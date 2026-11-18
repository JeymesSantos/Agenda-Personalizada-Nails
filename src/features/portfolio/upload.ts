"use client"

import { upload } from "@vercel/blob/client"

export async function uploadPortfolioFile(
  file: File,
  mode: "local" | "blob",
  pathPrefix: string,
): Promise<string> {
  const endpoint = "/api/uploads/portfolio"
  if (mode === "blob") {
    const safe =
      file.type === "video/mp4"
        ? `${crypto.randomUUID()}.mp4`
        : file.name.replace(/[^\w.-]+/g, "-").slice(-80)
    const blob = await upload(`${pathPrefix}/${safe}`, file, {
      access: "public",
      handleUploadUrl: endpoint,
      contentType: file.type,
    })
    return blob.url
  }
  const form = new FormData()
  form.set("file", file)
  const response = await fetch(endpoint, { method: "POST", body: form })
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string }
  if (!response.ok || !data.url) throw new Error(data.error ?? "Falha ao enviar a foto.")
  return data.url
}
