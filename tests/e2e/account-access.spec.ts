import { expect, test } from "@playwright/test"

import { TestDb, workdayAhead } from "./helpers"

const db = new TestDb()
test.afterAll(() => db.close())

async function existingGuest() {
  const guest = await db.one<{ id: string; name: string; whatsapp: string; email: string | null }>(
    `select u.id, u.name, u.whatsapp, u.email from "User" u
     where u.role = 'CLIENT' and u."passwordHash" is null and u.whatsapp is not null
       and exists(select 1 from "Appointment" a where a."clientId" = u.id)
     order by u.id limit 1`,
  )
  expect(guest).not.toBeNull()
  return guest!
}

test("cadastro não assume o histórico de quem já agendou sem conta", async ({ page }) => {
  const guest = await existingGuest()
  const email = `tentativa-${Date.now()}@example.test`
  await page.goto("/cadastro")
  await page.getByLabel("Nome", { exact: true }).fill("Tentativa de vínculo")
  await page.getByLabel("WhatsApp", { exact: true }).fill(guest.whatsapp)
  await page.getByLabel("E-mail", { exact: true }).fill(email)
  await page.getByLabel("Senha", { exact: true }).fill("senha-teste-123")
  await page.getByLabel("Confirmar senha", { exact: true }).fill("senha-teste-123")
  await page.getByRole("button", { name: "Criar conta", exact: true }).click()
  await expect(page.getByText(/Não foi possível usar este WhatsApp/)).toBeVisible()
  await expect(page).toHaveURL(/\/cadastro$/)
  expect(
    await db.one('select name, email, "passwordHash" from "User" where id = $1', [guest.id]),
  ).toEqual({ name: guest.name, email: guest.email, passwordHash: null })
  expect(await db.count('select count(*) from "User" where email = $1', [email])).toBe(0)
  await page.goto("/meus-horarios")
  await expect(page).toHaveURL(/\/entrar/)
})

test("novo agendamento não altera a cliente e seu link não abre o histórico anterior", async ({
  page,
}) => {
  const guest = await existingGuest()
  const other = await db.one<{ id: string }>(
    'select id from "Appointment" where "clientId" = $1 limit 1',
    [guest.id],
  )
  const service = await db.one<{ id: string }>(
    'select id from "Service" where visible = true order by "durationMin" limit 1',
  )
  await page.goto(`/agendar/${service!.id}/horario?mes=${workdayAhead(40).slice(0, 7)}`)
  const day = page.getByRole("link", { name: /^Dia \d+$/ }).first()
  const href = await day.getAttribute("href")
  await day.click()
  await expect(page).toHaveURL(new URL(href!, page.url()).toString())
  await page
    .getByRole("button", { name: /^\d{2}:\d{2}$/ })
    .first()
    .click()
  await page.getByRole("link", { name: "Continuar", exact: true }).click()
  await page.getByLabel("Nome", { exact: true }).fill("Nome sem comprovação")
  await page.getByLabel("WhatsApp", { exact: true }).fill(guest.whatsapp)
  await page.getByRole("button", { name: "Confirmar agendamento" }).click()
  await expect(page).toHaveURL(/\/agendamento\/.*\?t=/)
  const url = new URL(page.url())
  const token = url.searchParams.get("t")!
  const appointment = await db.appointmentByCode(url.pathname.split("/").pop()!)
  expect(appointment!.id).not.toBe(other!.id)
  expect(
    (await db.one<{ name: string }>('select name from "User" where id = $1', [guest.id]))!.name,
  ).toBe(guest.name)
  await page.goto(`/meus-horarios?t=${token}`)
  await expect(page.locator("article")).toHaveCount(1)
  await expect(page.locator(`a[href*="/meus-horarios/${other!.id}/"]`)).toHaveCount(0)
  await page.getByRole("tab", { name: "Anteriores", exact: true }).click()
  await expect(page.getByText("Nenhum atendimento anterior")).toBeVisible()
  const forbidden = await page.goto(`/meus-horarios/${other!.id}/remarcar?t=${token}`)
  expect(forbidden?.status()).toBe(404)
  const allowed = await page.goto(`/meus-horarios/${appointment!.id}/remarcar?t=${token}`)
  expect(allowed?.status()).toBe(200)
  await expect(page.getByRole("heading", { name: "Trocar dia ou horário" })).toBeVisible()
})

test("conta nova é criada e login existente preserva acesso ao próprio histórico", async ({
  page,
}) => {
  const stamp = Date.now()
  await page.goto("/cadastro")
  await page.getByLabel("Nome", { exact: true }).fill("Nova cliente de teste")
  await page.getByLabel("WhatsApp", { exact: true }).fill(`117${String(stamp).slice(-8)}`)
  await page.getByLabel("E-mail", { exact: true }).fill(`nova-${stamp}@example.test`)
  await page.getByLabel("Senha", { exact: true }).fill("senha-teste-123")
  await page.getByLabel("Confirmar senha", { exact: true }).fill("senha-teste-123")
  await page.getByRole("button", { name: "Criar conta", exact: true }).click()
  await expect(page).toHaveURL(/\/meus-horarios$/)
  await expect(page.getByText("Nenhum horário agendado")).toBeVisible()
  await page.goto("/api/auth/sair")
  await page.goto("/entrar")
  await page.getByLabel("E-mail").fill("mariana@example.com")
  await page.getByLabel("Senha", { exact: true }).fill("cliente123")
  await page.getByRole("button", { name: "Entrar", exact: true }).click()
  await expect(page).toHaveURL(/\/meus-horarios$/)
  const upcoming = await page.locator("article").count()
  await page.getByRole("tab", { name: "Anteriores", exact: true }).click()
  const past = await page.locator("article").count()
  expect(upcoming + past).toBeGreaterThan(1)
})
