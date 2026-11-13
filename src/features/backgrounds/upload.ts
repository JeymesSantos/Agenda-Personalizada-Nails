"use client"

import { upload } from "@vercel/blob/client"

export type UploadMode = "local" | "blob"

const ENDPOINT = "/api/uploads/background"

/*
 * Envia um arquivo de fundo e devolve a URL. Em `blob` o arquivo vai do
 * navegador direto para o Vercel Blob (a rota só emite o token); em `local`
 * sobe em multipart para a rota, que grava pelo storage do servidor.
 */
export async function uploadBackgroundFile(
  file: File,
  kind: "image" | "video",
  mode: UploadMode,
  pathPrefix: string,
): Promise<string> {
  if (mode === "blob") {
    const safe = file.name.replace(/[^\w.-]+/g, "-").slice(-80)
    const blob = await upload(`${pathPrefix}/${safe}`, file, {
      access: "public",
      handleUploadUrl: ENDPOINT,
      contentType: file.type,
    })
    return blob.url
  }
  const fd = new FormData()
  fd.set("file", file)
  fd.set("kind", kind)
  const res = await fetch(ENDPOINT, { method: "POST", body: fd })
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
  if (!res.ok || !data.url) throw new Error(data.error ?? "Falha ao enviar o arquivo.")
  return data.url
}
