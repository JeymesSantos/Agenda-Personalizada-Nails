import { TZDate } from "@date-fns/tz"
import { describe, expect, it } from "vitest"

import { planReminders } from "./plan"
import {
  manageUrl,
  type ReminderContext,
  reminderHtml,
  reminderSubject,
  reminderText,
  whatsappLink,
} from "./templates"

const TZ = "America/Sao_Paulo"
const startsAt = new TZDate(2026, 10, 20, 14, 15, 0, TZ) // sexta, 20/11/2026 14:15

describe("planReminders", () => {
  it("confirmação agora, 24 h e 2 h antes quando há tempo", () => {
    const now = new TZDate(2026, 10, 10, 9, 0, 0, TZ)
    const plan = planReminders(startsAt, now)
    expect(plan.map((p) => p.kind)).toEqual(["CONFIRMATION", "BEFORE_24H", "BEFORE_2H"])
    expect(plan[0].sendAt).toEqual(now)
    expect(plan[1].sendAt.getTime()).toBe(startsAt.getTime() - 24 * 3600_000)
    expect(plan[2].sendAt.getTime()).toBe(startsAt.getTime() - 2 * 3600_000)
  })

  it("pula o aviso de 24 h quando o agendamento é para hoje", () => {
    const now = new TZDate(2026, 10, 20, 9, 0, 0, TZ)
    expect(planReminders(startsAt, now).map((p) => p.kind)).toEqual(["CONFIRMATION", "BEFORE_2H"])
  })

  it("só confirmação quando falta menos de 2 h", () => {
    const now = new TZDate(2026, 10, 20, 13, 0, 0, TZ)
    expect(planReminders(startsAt, now).map((p) => p.kind)).toEqual(["CONFIRMATION"])
  })
})

const ctx: ReminderContext = {
  kind: "BEFORE_24H",
  clientName: "Mariana Souza",
  businessName: "Letícia Fagundes",
  serviceTitle: "Alongamento em gel",
  startsAt,
  timezone: TZ,
  code: "LF-2451",
  manageToken: "tok 123",
  baseUrl: "https://agenda.exemplo.com",
  addressLine: "Rua das Flores, 120",
  neighborhood: "Centro",
}

describe("templates", () => {
  it("link de gerenciamento aponta para o comprovante com o token", () => {
    expect(manageUrl(ctx)).toBe("https://agenda.exemplo.com/agendamento/LF-2451?t=tok%20123")
  })

  it("texto traz primeiro nome, serviço, data local e link", () => {
    const text = reminderText(ctx)
    expect(text).toContain("Oi, Mariana!")
    expect(text).toContain("Alongamento em gel")
    expect(text).toContain("Sexta-feira, 20 de novembro, às 14:15")
    expect(text).toContain("Rua das Flores, 120 · Centro")
    expect(text).toContain(manageUrl(ctx))
  })

  it("assunto varia com o tipo", () => {
    expect(reminderSubject({ ...ctx, kind: "CONFIRMATION" })).toMatch(/^Horário confirmado/)
    expect(reminderSubject(ctx)).toMatch(/^É amanhã/)
    expect(reminderSubject({ ...ctx, kind: "BEFORE_2H" })).toMatch(/^Daqui a pouco/)
  })

  it("HTML escapa conteúdo e inclui o botão", () => {
    const html = reminderHtml({ ...ctx, serviceTitle: "Nail art <festa>" })
    expect(html).toContain("Nail art &lt;festa&gt;")
    expect(html).toContain('href="https://agenda.exemplo.com/agendamento/LF-2451?t=tok%20123"')
  })

  it("link wa.me com DDI e texto codificado", () => {
    expect(whatsappLink("(11) 99876-5432", "Oi, tudo bem?")).toBe(
      "https://wa.me/5511998765432?text=Oi%2C%20tudo%20bem%3F",
    )
    expect(whatsappLink("5511998765432", "x")).toBe("https://wa.me/5511998765432?text=x")
  })
})
