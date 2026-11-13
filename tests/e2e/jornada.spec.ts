import { expect, test, type Browser } from "@playwright/test"

import { kpiValue, loginAdmin, parseReais, TestDb, workdayAhead } from "./helpers"

/*
 * Jornada ponta a ponta do plano (D3):
 * admin cria serviço e bloqueia a tarde → cliente sem cadastro agenda de manhã
 * → admin conclui o atendimento → dashboard soma a receita → cliente cancela
 * outro agendamento pelo link com token.
 */
const stamp = Date.now().toString().slice(-6)
const SERVICE_TITLE = `Spa das mãos ${stamp}`
const SERVICE_PRICE_CENTS = 15_000
const CLIENT = { name: `Cliente E2E ${stamp}`, whatsapp: `1198${stamp}1` }
const BLOCK_REASON = `Tarde bloqueada pelo e2e ${stamp}`
const DAY = workdayAhead(30)

const db = new TestDb()
test.afterAll(async () => {
  await db.close()
})

async function bookAsGuest(browser: Browser, serviceId: string) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(`/agendar/${serviceId}/horario?data=${DAY}`)
  /* a tarde foi bloqueada: só horários da manhã */
  /* o passo 2 renderiza a lista duas vezes (celular oculto + desktop): só a visível conta */
  await expect(page.getByText("Manhã").locator("visible=true").first()).toBeVisible()
  await expect(page.getByText("Tarde")).toHaveCount(0)
  await page
    .getByRole("button", { name: /^\d{2}:\d{2}$/ })
    .first()
    .click()
  await page.getByRole("link", { name: "Continuar" }).click()
  await expect(page).toHaveURL(/\/dados\?h=/)
  await page.getByLabel("Nome").fill(CLIENT.name)
  await page.getByLabel("WhatsApp").fill(CLIENT.whatsapp)
  await page.getByRole("button", { name: "Confirmar agendamento" }).click()
  await expect(page).toHaveURL(/\/agendamento\/[A-Z]+-\d+\?t=/)
  await expect(page.getByRole("heading", { name: "Horário confirmado!" })).toBeVisible()
  const url = new URL(page.url())
  const code = url.pathname.split("/").pop()!
  const token = url.searchParams.get("t")!
  return { context, page, code, token }
}

test("jornada completa: serviço → bloqueio → agendamento → conclusão → receita → cancelamento", async ({
  page,
  browser,
}) => {
  let serviceId = ""
  let revenueBefore = 0
  let firstCode = ""

  await test.step("admin cria um serviço", async () => {
    await loginAdmin(page)
    await page.goto("/admin/servicos/novo")
    await page.getByLabel("Título do serviço").fill(SERVICE_TITLE)
    await page.getByLabel("Descrição").fill("Criado pelo teste de ponta a ponta.")
    await page.getByLabel("Valor", { exact: true }).fill("150,00")
    await page.getByRole("button", { name: "Salvar serviço" }).click()
    await expect(page).toHaveURL(/\/admin\/servicos(\?.*)?$/)
    await expect(page.getByText(SERVICE_TITLE).first()).toBeVisible()
    const service = await db.serviceByTitle(SERVICE_TITLE)
    expect(service?.priceCents).toBe(SERVICE_PRICE_CENTS)
    serviceId = service!.id
  })

  await test.step("admin bloqueia a tarde do dia escolhido", async () => {
    await page.goto("/admin/disponibilidade?bloquear=1")
    const dialog = page.getByRole("dialog", { name: "Bloquear ou liberar horários" })
    await expect(dialog).toBeVisible()
    await dialog.getByRole("button", { name: "Faixa de horário" }).click()
    await dialog.locator('input[name="startDate"]').fill(DAY)
    await dialog.locator('input[name="startTime"]').fill("12:00")
    await dialog.locator('input[name="endTime"]').fill("19:00")
    await dialog.locator('input[name="reason"]').fill(BLOCK_REASON)
    await dialog.getByRole("button", { name: "Aplicar bloqueio" }).click()
    await expect(dialog).toBeHidden()
    expect((await db.exceptionByReason(BLOCK_REASON))?.type).toBe("BLOCK")
  })

  await test.step("dashboard: receita do ano antes", async () => {
    await page.goto("/admin?periodo=ano")
    revenueBefore = parseReais(await kpiValue(page, /^Faturamento/))
  })

  await test.step("cliente sem cadastro agenda de manhã", async () => {
    const booking = await bookAsGuest(browser, serviceId)
    firstCode = booking.code
    await booking.context.close()
    const a = await db.appointmentByCode(firstCode)
    expect(a?.serviceId).toBe(serviceId)
    expect(a?.status).toBe("CONFIRMED")
    expect(a?.clientName).toBe(CLIENT.name)
    /* lembretes de WhatsApp (cliente sem e-mail): confirmação + 24 h + 2 h */
    expect(await db.whatsappReminders(a!.id)).toBe(3)
  })

  await test.step("admin conclui o atendimento", async () => {
    const a = await db.appointmentByCode(firstCode)
    await page.goto(`/admin/agenda?visao=dia&data=${DAY}&agendamento=${a!.id}`)
    await expect(page.getByRole("heading", { name: "Detalhe do agendamento" })).toBeVisible()
    await expect(page.getByText(CLIENT.name).first()).toBeVisible()
    await page.getByRole("button", { name: "Marcar como concluído" }).click()
    await expect(page.getByText("Atendimento concluído.")).toBeVisible()
    await expect.poll(() => db.statusOf(firstCode)).toBe("DONE")
  })

  await test.step("dashboard soma a receita do serviço", async () => {
    await page.goto("/admin?periodo=ano")
    const after = parseReais(await kpiValue(page, /^Faturamento/))
    expect(after - revenueBefore).toBe(SERVICE_PRICE_CENTS)
  })

  await test.step("cliente cancela outro agendamento pelo link com token", async () => {
    const booking = await bookAsGuest(browser, serviceId)
    const { page: client, token, code } = booking
    await client.goto(`/meus-horarios?t=${token}`)
    const card = client
      .locator("article")
      .filter({ hasText: SERVICE_TITLE })
      .filter({ has: client.getByRole("button", { name: "Cancelar" }) })
    await card.first().getByRole("button", { name: "Cancelar" }).click()
    await client.getByRole("button", { name: "Confirmar cancelamento" }).click()
    await expect(client.getByText("Agendamento cancelado.")).toBeVisible()
    await expect.poll(() => db.statusOf(code)).toBe("CANCELLED")
    await booking.context.close()
  })
})
