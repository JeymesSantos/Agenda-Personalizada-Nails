import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/session", () => ({ getCurrentUser: vi.fn() }))
vi.mock("@/lib/prisma", () => ({
  prisma: { business: { findUnique: vi.fn() } },
}))
vi.mock("@/lib/storage", () => ({
  isBlobStorage: vi.fn(() => false),
  saveUpload: vi.fn(async () => ({ url: "/uploads/portfolio/business/photo.jpg" })),
  saveVideoUpload: vi.fn(async () => ({ url: "/uploads/portfolio/business/clip.mp4" })),
}))

import { getCurrentUser } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { saveUpload, saveVideoUpload } from "@/lib/storage"
import { POST } from "./route"

function request(size: number, type = "image/jpeg") {
  const form = new FormData()
  form.set("file", new File([new Uint8Array(size)], "foto.jpg", { type }))
  return new Request("http://localhost/api/uploads/portfolio", { method: "POST", body: form })
}

describe("upload de fotos do portfólio", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "admin", role: "ADMIN" } as Awaited<
      ReturnType<typeof getCurrentUser>
    >)
    vi.mocked(prisma.business.findUnique).mockResolvedValue({ id: "business" } as Awaited<
      ReturnType<typeof prisma.business.findUnique>
    >)
  })

  it("aceita uma foto de 5 MB, acima do limite das Server Actions", async () => {
    const response = await POST(request(5 * 1024 * 1024))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ url: "/uploads/portfolio/business/photo.jpg" })
    expect(saveUpload).toHaveBeenCalledWith(expect.any(File), "portfolio/business")
  })

  it("rejeita fotos acima de 5 MB e arquivos incompatíveis sem salvá-los", async () => {
    expect((await POST(request(5 * 1024 * 1024 + 1))).status).toBe(400)
    expect((await POST(request(10, "text/plain"))).status).toBe(400)
    expect(saveUpload).not.toHaveBeenCalled()
  })

  it("exige autenticação administrativa", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    expect((await POST(request(10))).status).toBe(401)
    expect(saveUpload).not.toHaveBeenCalled()
  })

  it("aceita MP4 curto e rejeita vídeos acima de 15 segundos", async () => {
    for (const seconds of [15, 16]) {
      const bytes = new Uint8Array(36)
      const view = new DataView(bytes.buffer)
      view.setUint32(0, 36)
      bytes.set(new TextEncoder().encode("moov"), 4)
      view.setUint32(8, 28)
      bytes.set(new TextEncoder().encode("mvhd"), 12)
      view.setUint32(28, 1000)
      view.setUint32(32, seconds * 1000)
      const form = new FormData()
      form.set("file", new File([bytes], "clip.mp4", { type: "video/mp4" }))
      const response = await POST(
        new Request("http://localhost/api/uploads/portfolio", {
          method: "POST",
          body: form,
        }),
      )
      expect(response.status).toBe(seconds === 15 ? 200 : 400)
    }
    expect(saveVideoUpload).toHaveBeenCalledTimes(1)
    expect(saveUpload).not.toHaveBeenCalled()
  })
})
