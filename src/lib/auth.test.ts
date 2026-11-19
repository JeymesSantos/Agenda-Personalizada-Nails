import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: vi.fn() } } }))
vi.mock("bcryptjs", () => ({ default: { compare: vi.fn() } }))
vi.mock("next-auth/providers/credentials", () => ({ default: (config: unknown) => config }))
vi.mock("next-auth", () => ({ default: vi.fn(() => ({})) }))

import bcrypt from "bcryptjs"
import NextAuth from "next-auth"
import { prisma } from "./prisma"
import "./auth"

const config = vi.mocked(NextAuth).mock.calls[0][0] as unknown as {
  providers: { authorize: (raw: Record<string, string>) => Promise<unknown> }[]
}
const authorize = config.providers[0].authorize
const client = {
  id: "client",
  name: "Cliente",
  role: "CLIENT",
  whatsapp: "11998765432",
  email: "antigo@example.test",
  passwordHash: "hash",
}

beforeEach(() => {
  vi.mocked(prisma.user.findUnique).mockReset()
  vi.mocked(bcrypt.compare).mockReset()
})

describe("credenciais por perfil", () => {
  it("normaliza o WhatsApp da cliente e não retorna seu e-mail antigo", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(client as never)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    expect(
      await authorize({ role: "CLIENT", whatsapp: "+55 (11) 99876-5432", password: "senha" }),
    ).toEqual({ id: client.id, name: client.name, role: "CLIENT", email: null })
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { whatsapp: client.whatsapp } })
  })

  it("rejeita login da cliente por e-mail e credenciais sem perfil", async () => {
    expect(await authorize({ role: "CLIENT", email: client.email, password: "senha" })).toBeNull()
    expect(await authorize({ email: client.email, password: "senha" })).toBeNull()
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it("mantém e-mail para admin e impede acesso cruzado entre perfis", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...client, role: "ADMIN" } as never)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    expect(
      await authorize({ role: "ADMIN", email: client.email, password: "senha" }),
    ).toMatchObject({ role: "ADMIN", email: client.email })
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: client.email } })
    expect(
      await authorize({ role: "CLIENT", whatsapp: client.whatsapp, password: "senha" }),
    ).toBeNull()
    vi.mocked(prisma.user.findUnique).mockResolvedValue(client as never)
    expect(await authorize({ role: "ADMIN", email: client.email, password: "senha" })).toBeNull()
  })

  it("rejeita senha incorreta e contas sem senha", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(client as never)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)
    expect(
      await authorize({ role: "CLIENT", whatsapp: client.whatsapp, password: "errada" }),
    ).toBeNull()
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...client, passwordHash: null } as never)
    expect(
      await authorize({ role: "CLIENT", whatsapp: client.whatsapp, password: "senha" }),
    ).toBeNull()
  })
})
