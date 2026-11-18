import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
import { createPasswordReset, passwordResetClientId, validPasswordReset } from "./password-reset"

const account = {
  id: "cliente",
  passwordHash: "hash-anterior",
  whatsapp: "11987654321",
  email: "cliente@example.com",
}

beforeEach(() => vi.stubEnv("AUTH_SECRET", "test-reset-secret"))
afterEach(() => vi.unstubAllEnvs())

describe("link de recuperação", () => {
  it("aceita a assinatura válida apenas durante uma hora", () => {
    const token = createPasswordReset(account, 1000)
    expect(passwordResetClientId(token)).toBe(account.id)
    expect(validPasswordReset(token, account, 2000)).toBe(true)
    expect(validPasswordReset(token, account, 1000 + 60 * 60000)).toBe(false)
    expect(validPasswordReset(`${token}x`, account, 2000)).toBe(false)
    expect(validPasswordReset("inválido", account, 2000)).toBe(false)
  })

  it("invalida o link após a troca da senha ou do contato e rejeita outra cliente", () => {
    const token = createPasswordReset(account, 1000)
    for (const changed of [
      { passwordHash: "nova-senha" },
      { whatsapp: "21987654321" },
      { email: "outra@example.com" },
      { id: "outra-cliente" },
    ])
      expect(validPasswordReset(token, { ...account, ...changed }, 2000)).toBe(false)
  })

  it("não depende de campos extras nem da ordem dos campos da consulta ao banco", () => {
    const token = createPasswordReset({ ...account, updatedAt: new Date() } as typeof account, 1000)
    expect(
      validPasswordReset(
        token,
        {
          email: account.email,
          whatsapp: account.whatsapp,
          passwordHash: account.passwordHash,
          id: account.id,
        },
        2000,
      ),
    ).toBe(true)
  })
})
