import type { ReminderKind } from "@/generated/prisma/enums"
import { fmtLongDate, fmtTime } from "@/lib/dates"

/*
 * Textos dos lembretes (e-mail e WhatsApp). Funções puras: recebem só o que
 * precisam do agendamento e devolvem assunto/texto/HTML. Os botões
 * "Confirmar / Remarcar" apontam para o comprovante com o token de
 * gerenciamento, onde a cliente cancela ou remarca sem cadastro.
 */
export type ReminderContext = {
  kind: ReminderKind
  clientName: string
  businessName: string
  serviceTitle: string
  startsAt: Date
  timezone: string
  code: string
  manageToken: string
  baseUrl: string
  addressLine?: string | null
  neighborhood?: string | null
  businessWhatsapp?: string | null
}

export const REMINDER_KIND_LABELS: Record<ReminderKind, string> = {
  CONFIRMATION: "Confirmação",
  BEFORE_24H: "Lembrete 24 h antes",
  BEFORE_2H: "Lembrete 2 h antes",
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name
}

export function manageUrl(ctx: Pick<ReminderContext, "baseUrl" | "code" | "manageToken">) {
  return `${ctx.baseUrl}/agendamento/${ctx.code}?t=${encodeURIComponent(ctx.manageToken)}`
}

function when(ctx: ReminderContext) {
  return `${fmtLongDate(ctx.startsAt, ctx.timezone)}, às ${fmtTime(ctx.startsAt, ctx.timezone)}`
}

function place(ctx: ReminderContext) {
  return [ctx.addressLine, ctx.neighborhood].filter(Boolean).join(" · ")
}

function headline(ctx: ReminderContext) {
  switch (ctx.kind) {
    case "CONFIRMATION":
      return `Horário confirmado: ${ctx.serviceTitle}`
    case "BEFORE_24H":
      return `É amanhã: ${ctx.serviceTitle}`
    case "BEFORE_2H":
      return `Daqui a pouco: ${ctx.serviceTitle}`
  }
}

function intro(ctx: ReminderContext) {
  const name = firstName(ctx.clientName)
  switch (ctx.kind) {
    case "CONFIRMATION":
      return `Oi, ${name}! Seu horário com ${ctx.businessName} está confirmado.`
    case "BEFORE_24H":
      return `Oi, ${name}! Passando para lembrar do seu horário com ${ctx.businessName} amanhã.`
    case "BEFORE_2H":
      return `Oi, ${name}! Seu horário com ${ctx.businessName} é daqui a pouco.`
  }
}

/* Texto curto para WhatsApp (link wa.me) e para a versão em texto do e-mail. */
export function reminderText(ctx: ReminderContext): string {
  const lines = [
    intro(ctx),
    "",
    `${ctx.serviceTitle}`,
    when(ctx),
    place(ctx),
    "",
    `Precisa remarcar ou cancelar? ${manageUrl(ctx)}`,
    `Comprovante ${ctx.code}`,
  ]
  return lines.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n")
}

export function reminderSubject(ctx: ReminderContext): string {
  return `${headline(ctx)} · ${fmtLongDate(ctx.startsAt, ctx.timezone)} ${fmtTime(ctx.startsAt, ctx.timezone)}`
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/* HTML simples, inline, legível em qualquer cliente de e-mail. */
export function reminderHtml(ctx: ReminderContext): string {
  const url = manageUrl(ctx)
  const rows = [
    ["Serviço", ctx.serviceTitle],
    ["Quando", when(ctx)],
    ["Onde", place(ctx)],
    ["Comprovante", ctx.code],
  ].filter(([, v]) => v)
  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#0e0a0c;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#f6e9f1">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
  <p style="font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#ff7ac8;margin:0 0 8px">${escapeHtml(ctx.businessName)}</p>
  <h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(headline(ctx))}</h1>
  <p style="font-size:15px;line-height:1.5;margin:0 0 20px">${escapeHtml(intro(ctx))}</p>
  <table style="width:100%;border-collapse:collapse;background:#171114;border-radius:12px;overflow:hidden">
    ${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:10px 14px;color:#b9a6b2;font-size:13px;width:34%">${escapeHtml(k)}</td><td style="padding:10px 14px;font-size:15px">${escapeHtml(v as string)}</td></tr>`,
      )
      .join("")}
  </table>
  <p style="margin:24px 0 8px">
    <a href="${url}" style="display:inline-block;background:#e51c98;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">Ver, remarcar ou cancelar</a>
  </p>
  <p style="font-size:12px;color:#b9a6b2;line-height:1.5">Se o botão não abrir, copie este link: <a href="${url}" style="color:#ff7ac8">${url}</a></p>
</div>
</body></html>`
}

/* Link wa.me com o texto pronto para a profissional enviar (WhatsApp manual). */
export function whatsappLink(whatsapp: string, text: string): string {
  const digits = whatsapp.replace(/\D/g, "")
  const full = digits.startsWith("55") ? digits : `55${digits}`
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`
}
