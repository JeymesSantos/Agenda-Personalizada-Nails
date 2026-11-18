import { expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
import { createInvitation, readInvitation } from "./invitation"

it("aceita apenas convites assinados e dentro da validade", () => {
  vi.stubEnv("AUTH_SECRET", "test-invitation-secret")
  const token = createInvitation("cliente", 1000)
  expect(readInvitation(token, 2000)).toBe("cliente")
  expect(readInvitation(token, 1000 + 7 * 86400000)).toBeNull()
  expect(readInvitation(`${token}x`, 2000)).toBeNull()
  expect(readInvitation("invalido", 2000)).toBeNull()
  vi.unstubAllEnvs()
})
