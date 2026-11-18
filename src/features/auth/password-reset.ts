import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"

type ResetAccount = {
  id: string
  passwordHash: string
  whatsapp: string | null
  email: string | null
}

export const RESET_VALIDITY_MINUTES = 60

function signature(payload: string, account: ResetAccount) {
  if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET não configurado")
  return createHmac("sha256", process.env.AUTH_SECRET)
    .update(
      JSON.stringify([
        "client-password-reset",
        payload,
        account.id,
        account.passwordHash,
        account.whatsapp,
        account.email,
      ]),
    )
    .digest("base64url")
}

export function createPasswordReset(account: ResetAccount, now = Date.now()) {
  const payload = Buffer.from(
    JSON.stringify({ clientId: account.id, expires: now + RESET_VALIDITY_MINUTES * 60000 }),
  ).toString("base64url")
  return `${payload}.${signature(payload, account)}`
}

// O id serve apenas para buscar a conta. A assinatura deve ser validada antes de usá-la.
export function passwordResetClientId(token: string): string | null {
  try {
    if (token.length > 2048) return null
    const [payload, supplied, extra] = token.split(".")
    if (!payload || !supplied || extra) return null
    const data = JSON.parse(Buffer.from(payload, "base64url").toString())
    return typeof data.clientId === "string" ? data.clientId : null
  } catch {
    return null
  }
}

export function validPasswordReset(token: string, account: ResetAccount, now = Date.now()) {
  try {
    if (passwordResetClientId(token) !== account.id) return false
    const [payload, supplied] = token.split(".")
    const expected = Buffer.from(signature(payload, account))
    const actual = Buffer.from(supplied)
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false
    const data = JSON.parse(Buffer.from(payload, "base64url").toString())
    return Number.isFinite(data.expires) && data.expires > now
  } catch {
    return false
  }
}
