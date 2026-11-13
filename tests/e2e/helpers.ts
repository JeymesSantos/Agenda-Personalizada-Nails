import { TZDate } from "@date-fns/tz"
import { expect, type Page } from "@playwright/test"
import { addDays, format } from "date-fns"
import { Pool } from "pg"

import { E2E_DATABASE_URL } from "./env"

export const TZ = "America/Sao_Paulo"

export const ADMIN = { email: "leticia@minhaagenda.app", password: "leticia123" }

/*
 * Acesso ao banco de teste para buscar ids e conferir estado. SQL direto via
 * `pg`: o cliente Prisma gerado é ESM e o runner do Playwright não o carrega.
 */
export class TestDb {
  private pool = new Pool({ connectionString: E2E_DATABASE_URL })

  async one<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    const { rows } = await this.pool.query(sql, params)
    return (rows[0] as T) ?? null
  }

  async count(sql: string, params: unknown[] = []): Promise<number> {
    const row = await this.one<{ count: string }>(sql, params)
    return Number(row?.count ?? 0)
  }

  serviceByTitle(title: string) {
    return this.one<{ id: string; priceCents: number }>(
      'select id, "priceCents" from "Service" where title = $1',
      [title],
    )
  }

  exceptionByReason(reason: string) {
    return this.one<{ id: string; type: string }>(
      'select id, type from "ScheduleException" where reason = $1',
      [reason],
    )
  }

  appointmentByCode(code: string) {
    return this.one<{
      id: string
      status: string
      serviceId: string
      clientName: string
    }>(
      `select a.id, a.status, a."serviceId", u.name as "clientName"
       from "Appointment" a join "User" u on u.id = a."clientId"
       where a.code = $1`,
      [code],
    )
  }

  whatsappReminders(appointmentId: string) {
    return this.count(
      `select count(*) from "Reminder" where "appointmentId" = $1 and channel = 'WHATSAPP'`,
      [appointmentId],
    )
  }

  async statusOf(code: string): Promise<string | null> {
    return (await this.appointmentByCode(code))?.status ?? null
  }

  close() {
    return this.pool.end()
  }
}

/*
 * Um dia útil (seg–sáb) a `daysAhead` dias, no fuso do estúdio, "YYYY-MM-DD".
 * Longe o bastante dos agendamentos do seed (próximos 14 dias) e dentro do
 * prazo de cancelamento gratuito (24 h).
 */
export function workdayAhead(daysAhead: number): string {
  let d = new TZDate(addDays(new Date(), daysAhead), TZ)
  while (d.getDay() === 0) d = new TZDate(addDays(d, 1), TZ)
  return format(d, "yyyy-MM-dd")
}

export async function loginAdmin(page: Page) {
  await page.goto("/admin/entrar")
  await page.getByLabel("E-mail").fill(ADMIN.email)
  await page.getByLabel("Senha").fill(ADMIN.password)
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page).toHaveURL(/\/admin(\?.*)?$/)
}

/* "R$ 1.645" | "R$ 1.645,50" → centavos */
export function parseReais(text: string): number {
  const m = text.replace(/\s/g, "").match(/-?R\$([\d.]+)(?:,(\d{2}))?/)
  if (!m) throw new Error(`valor não reconhecido: ${text}`)
  const reais = Number(m[1].replace(/\./g, ""))
  const cents = m[2] ? Number(m[2]) : 0
  return (text.includes("-") ? -1 : 1) * (reais * 100 + cents)
}

/* Valor de um KpiCard do dashboard pelo rótulo. */
export async function kpiValue(page: Page, label: RegExp | string): Promise<string> {
  const card = page.locator('[data-slot="kpi-card"]').filter({ hasText: label }).first()
  await expect(card).toBeVisible()
  return (await card.locator("p").first().innerText()).trim()
}
