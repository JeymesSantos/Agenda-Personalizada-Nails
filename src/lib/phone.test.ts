import { describe, expect, it } from "vitest"
import { whatsappSchema } from "@/features/auth/schemas"
import { formatPhoneInput } from "./phone"

describe("telefone com DDD", () => {
  it("normaliza formatos nacionais e internacionais para o mesmo contato", () => {
    for (const value of ["11999887766", "(11) 99988-7766", "+55 (11) 99988-7766"])
      expect(whatsappSchema.parse(value)).toBe("11999887766")
    expect(whatsappSchema.parse("(55) 99988-7766")).toBe("55999887766")
    expect(whatsappSchema.parse("+55 55 99988-7766")).toBe("55999887766")
  })
  it("aceita telefone fixo e exige DDD sem inventá-lo", () => {
    expect(whatsappSchema.parse("(11) 3456-7890")).toBe("1134567890")
    expect(whatsappSchema.safeParse("99988-7766").success).toBe(false)
    expect(formatPhoneInput("+55 11 99988-7766")).toBe("(11) 99988-7766")
  })
})
