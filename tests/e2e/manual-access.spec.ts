import { expect, test } from "@playwright/test"
import { loginAdmin, TestDb } from "./helpers"

const db = new TestDb()
test.afterAll(() => db.close())

test("login oferece recuperação manual e cadastro informa que convite é opcional", async ({
  page,
}) => {
  await page.goto("/entrar")
  await page.getByRole("link", { name: "Esqueci minha senha" }).click()
  const request = page.getByRole("link", { name: "Pedir recuperação pelo WhatsApp" })
  await expect(request).toHaveAttribute("href", /https:\/\/wa.me\/55/)
  const message = new URL((await request.getAttribute("href"))!).searchParams.get("text")
  expect(message).toContain("Esqueci minha senha")
  await page.goto("/cadastro")
  await expect(page.getByText(/Não precisa de convite/)).toBeVisible()
  await page.goto("/redefinir-senha?token=invalido")
  await expect(page.getByText("Link inválido, expirado ou já utilizado.")).toBeVisible()
  await expect(page.getByRole("button", { name: "Salvar nova senha" })).toHaveCount(0)
})

test("admin prepara convite manual e cliente ativa a conta preservando o histórico", async ({
  page,
  browser,
}) => {
  const guest = await db.one<{ id: string; name: string; whatsapp: string }>(
    `select id, name, whatsapp from "User" u where role = 'CLIENT' and "passwordHash" is null and whatsapp is not null
      and exists(select 1 from "Appointment" a where a."clientId" = u.id) limit 1`,
  )
  expect(guest).not.toBeNull()
  const before = await db.count('select count(*) from "Appointment" where "clientId" = $1', [
    guest!.id,
  ])
  await loginAdmin(page)
  await page.goto(`/admin/clientes/${guest!.id}`)
  await page.getByRole("button", { name: "Enviar convite para criar conta" }).click()
  const whatsapp = page.getByRole("link", { name: "Abrir WhatsApp para enviar" })
  await expect(whatsapp).toBeVisible()
  const href = new URL((await whatsapp.getAttribute("href"))!)
  expect(href.pathname).toBe(`/55${guest!.whatsapp}`)
  const message = href.searchParams.get("text")!
  expect(message).toContain("7 dias")
  const url = message.match(/https?:\/\/\S+/)![0]
  const context = await browser.newContext()
  try {
    const client = await context.newPage()
    await client.goto(url)
    await client.getByLabel("Nome", { exact: true }).fill(guest!.name)
    await client.getByLabel("WhatsApp", { exact: true }).fill(guest!.whatsapp)
    await client.getByLabel("E-mail", { exact: true }).fill(`manual-${Date.now()}@example.test`)
    await client.getByLabel("Senha", { exact: true }).fill("senha-manual-123")
    await client.getByLabel("Confirmar senha", { exact: true }).fill("senha-manual-123")
    await client.getByRole("button", { name: "Criar conta", exact: true }).click()
    await expect(client).toHaveURL(/\/meus-horarios$/)
    expect(
      await db.count('select count(*) from "Appointment" where "clientId" = $1', [guest!.id]),
    ).toBe(before)
    await client.goto("/api/auth/sair")
    await client.goto(url)
    await client.getByLabel("Nome", { exact: true }).fill(guest!.name)
    await client.getByLabel("WhatsApp", { exact: true }).fill(guest!.whatsapp)
    await client.getByLabel("E-mail", { exact: true }).fill(`replay-${Date.now()}@example.test`)
    await client.getByLabel("Senha", { exact: true }).fill("senha-manual-123")
    await client.getByLabel("Confirmar senha", { exact: true }).fill("senha-manual-123")
    await client.getByRole("button", { name: "Criar conta", exact: true }).click()
    await expect(client.getByText(/O convite já foi usado/)).toBeVisible()
  } finally {
    await context.close()
  }
})

test("recuperação manual troca a senha e o mesmo link não pode ser reutilizado", async ({
  page,
  browser,
}) => {
  const account = await db.one<{ id: string; whatsapp: string }>(
    'select id, whatsapp from "User" where email = $1',
    ["mariana@example.com"],
  )
  await loginAdmin(page)
  await page.goto(`/admin/clientes/${account!.id}`)
  await page.getByRole("button", { name: "Enviar link de recuperação" }).click()
  const whatsapp = page.getByRole("link", { name: "Abrir WhatsApp para enviar" })
  await expect(whatsapp).toBeVisible()
  const href = new URL((await whatsapp.getAttribute("href"))!)
  expect(href.pathname).toBe(`/55${account!.whatsapp}`)
  const message = href.searchParams.get("text")!
  expect(message).toContain("1 hora")
  const url = message.match(/https?:\/\/\S+/)![0]
  const context = await browser.newContext()
  try {
    const client = await context.newPage()
    await client.goto(url)
    await client.getByLabel("Nova senha", { exact: true }).fill("nova-senha-456")
    await client.getByLabel("Confirmar nova senha", { exact: true }).fill("diferente")
    await client.getByRole("button", { name: "Salvar nova senha" }).click()
    await expect(client.getByText("As senhas não conferem")).toBeVisible()
    await client.getByLabel("Nova senha", { exact: true }).fill("nova-senha-456")
    await client.getByLabel("Confirmar nova senha", { exact: true }).fill("nova-senha-456")
    await client.getByRole("button", { name: "Salvar nova senha" }).click()
    await expect(client).toHaveURL(/\/entrar\?senha=alterada$/)
    await client.getByLabel("E-mail").fill("mariana@example.com")
    await client.getByLabel("Senha", { exact: true }).fill("cliente123")
    await client.getByRole("button", { name: "Entrar", exact: true }).click()
    await expect(client.getByText("E-mail ou senha incorretos.")).toBeVisible()
    await client.getByLabel("Senha", { exact: true }).fill("nova-senha-456")
    await client.getByRole("button", { name: "Entrar", exact: true }).click()
    await expect(client).toHaveURL(/\/meus-horarios$/)
    await client.goto("/api/auth/sair")
    await client.goto(url)
    await expect(client.getByText("Link inválido, expirado ou já utilizado.")).toBeVisible()
    await expect(client.getByRole("button", { name: "Salvar nova senha" })).toHaveCount(0)
  } finally {
    await context.close()
  }
})
