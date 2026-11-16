/** Store Brazilian numbers with DDD, without a duplicated country code. */
export function normalizeWhatsapp(value: string): string {
  const digits = value.replace(/\D/g, "")
  return (digits.length === 12 || digits.length === 13) && digits.startsWith("55")
    ? digits.slice(2)
    : digits
}

export function formatPhoneInput(value: string): string {
  const digits = normalizeWhatsapp(value)
  if (digits.length > 11) return value
  if (digits.length <= 2) return digits
  const number = digits.slice(2)
  const split = number.length > 8 ? 5 : 4
  return `(${digits.slice(0, 2)}) ${number.slice(0, split)}${number.length > split ? `-${number.slice(split)}` : ""}`
}
