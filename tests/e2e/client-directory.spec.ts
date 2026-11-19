import { expect, test } from "@playwright/test"
import { loginAdmin, TestDb } from "./helpers"

const db = new TestDb()
test.afterAll(() => db.close())

test("cliente aparece na lista do admin logo após se cadastrar, sem agendamento", async ({
  page,
  browser,
}) => {
  const stamp = Date.now()
  const name = `Cadastro sem agendamento ${stamp}`
  const whatsapp = `116${String(stamp).slice(-8)}`
  await page.goto("/cadastro")
  await page.getByLabel("Nome", { exact: true }).fill(name)
  await page.getByLabel("WhatsApp", { exact: true }).fill(whatsapp)
  await page.getByLabel("Senha", { exact: true }).fill("senha-teste-123")
  await page.getByLabel("Confirmar senha", { exact: true }).fill("senha-teste-123")
  await page.getByRole("button", { name: "Criar conta", exact: true }).click()
  await expect(page).toHaveURL(/\/meus-horarios$/)
  const client = await db.one<{ id: string }>('select id from "User" where whatsapp = $1', [
    whatsapp,
  ])
  expect(
    await db.count('select count(*) from "Appointment" where "clientId" = $1', [client!.id]),
  ).toBe(0)
  const admin = await browser.newContext()
  try {
    const adminPage = await admin.newPage()
    await loginAdmin(adminPage)
    await adminPage.goto("/admin/clientes")
    const row = adminPage.getByRole("link").filter({ hasText: name })
    await expect(row).toBeVisible()
    await expect(row).toContainText("0 visitas")
    await row.click()
    await expect(adminPage.getByRole("heading", { name })).toBeVisible()
  } finally {
    await admin.close()
  }
})
