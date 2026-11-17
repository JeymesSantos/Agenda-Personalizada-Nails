import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"

function signature(payload: string) {
  if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET não configurado")
  return createHmac("sha256", process.env.AUTH_SECRET)
    .update(`client-registration:${payload}`)
    .digest("base64url")
}

export function createInvitation(clientId: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ clientId, expires: now + 7 * 86400000 })).toString(
    "base64url",
  )
  return `${payload}.${signature(payload)}`
}

export function readInvitation(token: string, now = Date.now()): string | null {
  try {
    const [payload, supplied, extra] = token.split(".")
    if (!payload || !supplied || extra) return null
    const expected = Buffer.from(signature(payload))
    const actual = Buffer.from(supplied)
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
    const data = JSON.parse(Buffer.from(payload, "base64url").toString())
    return typeof data.clientId === "string" && data.expires > now ? data.clientId : null
  } catch {
    return null
  }
}
