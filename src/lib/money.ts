/* O Chrome usa U+202F (espaço fino) e o Node U+00A0 entre R$ e o número. */
const NBSP_RE = new RegExp("[\u00a0\u202f]", "g")

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
})

const brlCents = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** "R$ 8.420" — como no dashboard do Figma (sem centavos). */
export function formatCents(cents: number): string {
  return brl.format(Math.round(cents / 100)).replace(NBSP_RE, " ")
}

/** "R$ 180,00" — para formulários e despesas. */
export function formatCentsExact(cents: number): string {
  return brlCents.format(cents / 100).replace(NBSP_RE, " ")
}

/** "R$ 15+" quando o serviço é "a partir de". */
export function formatPrice(cents: number, from = false): string {
  return from ? `${formatCents(cents)}+` : formatCents(cents)
}

/** "180,00" → 18000. Aceita "R$ 1.234,56", "1234.56", "1234". */
export function parseCents(input: string): number | null {
  const cleaned = input.replace(/[^\d,.-]/g, "").trim()
  if (!cleaned) return null
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned
  const value = Number(normalized)
  if (!Number.isFinite(value)) return null
  return Math.round(value * 100)
}

export function formatPercent(value: number, signed = false): string {
  const rounded = Math.round(value)
  const sign = signed && rounded > 0 ? "+" : ""
  return `${sign}${rounded}%`
}
