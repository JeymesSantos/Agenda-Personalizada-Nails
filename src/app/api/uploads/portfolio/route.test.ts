import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/session", () => ({ getCurrentUser: vi.fn() }))
vi.mock("@/lib/prisma", () => ({
  prisma: { business: { findUnique: vi.fn() } },
}))
vi.mock("@/lib/storage", () => ({
  isBlobStorage: vi.fn(() => false),
  saveUpload: vi.fn(async () => ({ url: "/uploads/portfolio/business/photo.jpg" })),
}))

import { getCurrentUser } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { saveUpload } from "@/lib/storage"
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
})
