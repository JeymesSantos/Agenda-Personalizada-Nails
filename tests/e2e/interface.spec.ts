import { expect, test, type Page } from "@playwright/test"

import { loginAdmin, TestDb, workdayAhead } from "./helpers"

async function noHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1),
    `Conteúdo ultrapassa a largura da tela em ${page.url()}`,
  ).toBe(false)
}

/** Choose a green day from the real calendar, respecting holidays and full days. */
async function selectAvailableCalendarDay(page: Page): Promise<string> {
  for (let month = 0; month < 3; month++) {
    const nextMonth = page.getByRole("link", { name: "Próximo mês", exact: true })
    await expect(nextMonth).toBeVisible()
    const day = page
      .getByRole("link", { name: /^Dia \d+$/ })
      .filter({ has: page.locator(".bg-success") })
      .first()
    if (await day.count()) {
      const href = new URL((await day.getAttribute("href"))!, page.url())
      await day.click()
      await expect(page).toHaveURL(href.toString())
      return href.searchParams.get("data")!
    }
    const nextHref = new URL((await nextMonth.getAttribute("href"))!, page.url())
    await nextMonth.click()
    await expect(page).toHaveURL(nextHref.toString())
  }
  throw new Error("Nenhum dia disponível encontrado no calendário nos próximos três meses")
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 1000 },
]) {
  test.describe(`${viewport.width}px`, () => {
    test.use({ viewport })

    test("navegação pública, busca, filtros e detalhe do portfólio", async ({ page }, testInfo) => {
      const errors: string[] = []
      page.on("pageerror", (error) => errors.push(error.message))
      await page.goto("/")
      await noHorizontalOverflow(page)
      const nav = page.getByRole("navigation", {
        name: viewport.width < 1024 ? "Navegação principal" : "Páginas",
        exact: true,
      })
      await nav.getByRole("link", { name: "Portfólio", exact: true }).click()
      await expect(page).toHaveURL(/\/portfolio$/)
      await expect(page.getByRole("heading", { name: "Portfólio", exact: true })).toBeVisible()
      const album = page.locator('main a[href*="?album="]').first()
      await album.click()
      await expect(page).toHaveURL(/album=/)
      await page.locator('main a[href*="foto="]').first().click()
      await expect(page.getByRole("link", { name: "Fechar", exact: true })).toBeVisible()
      await page.getByRole("link", { name: "Fechar", exact: true }).click()
      await expect(page).not.toHaveURL(/foto=/)
      await noHorizontalOverflow(page)

      await nav
        .getByRole("link", { name: viewport.width < 1024 ? "Agendar" : "Serviços", exact: true })
        .click()
      const search = page.getByLabel("Buscar", { exact: true })
      await search.fill("serviço que não existe 12345")
      await expect(page.getByText("Nenhum serviço encontrado")).toBeVisible()
      await search.fill("")
      await page.getByRole("button", { name: "Todos", exact: true }).click()
      await expect(page.locator('main a[href$="/horario"]').first()).toBeVisible()
      await noHorizontalOverflow(page)
      await page.screenshot({ path: testInfo.outputPath("catalogo.png"), fullPage: true })
      await nav.getByRole("link", { name: "Meus horários", exact: true }).click()
      await expect(page).toHaveURL(/\/entrar\?next=/)
      expect(errors).toEqual([])
    })

    test("proteção do admin, validação de login, cliente e logout", async ({ page }) => {
      await page.goto("/admin/fundos")
      await expect(page).toHaveURL(/\/admin\/entrar/)
      await page.getByRole("button", { name: "Entrar no painel", exact: true }).click()
      await expect(page.getByText("Informe um e-mail válido")).toBeVisible()
      await expect(page.getByText("Informe a senha")).toBeVisible()
      await page.getByLabel("E-mail").fill("leticia@minhaagenda.app")
      await page.getByLabel("Senha", { exact: true }).fill("senha-incorreta")
      await page.getByRole("button", { name: "Entrar no painel", exact: true }).click()
      await expect(page.getByText(/e-mail ou senha/i)).toBeVisible()
      await page.goto("/entrar")
      await page.getByLabel("WhatsApp").fill("+55 (11) 99876-5432")
      await page.getByLabel("Senha", { exact: true }).fill("cliente123")
      await page.getByRole("button", { name: "Entrar", exact: true }).click()
      await expect(page).toHaveURL(/\/meus-horarios/)
      await expect(page.getByRole("heading", { name: "Meus horários", exact: true })).toBeVisible()
      await page.goto("/admin")
      await expect(page).not.toHaveURL(/\/admin$/)
      await page.goto("/api/auth/sair")
      await page.goto("/meus-horarios")
      await expect(page).toHaveURL(/\/entrar/)
    })

    test("painel, períodos, visões da agenda e demais páginas do admin", async ({
      page,
    }, testInfo) => {
      const errors: string[] = []
      page.on("pageerror", (error) => errors.push(error.message))
      await loginAdmin(page)
      for (const [name, value] of [
        ["Dia", "dia"],
        ["Semana", "semana"],
        ["Mês", "mes"],
        ["Ano", "ano"],
      ]) {
        await page.getByRole("tab", { name, exact: true }).click()
        await expect(page).toHaveURL(new RegExp(`periodo=${value}`))
      }
      await noHorizontalOverflow(page)
      const nav = page.getByRole("navigation", {
        name: viewport.width < 1024 ? "Navegação principal" : "Painel",
        exact: true,
      })
      await nav.getByRole("link", { name: "Agenda", exact: true }).click()
      await expect(page.getByRole("heading", { name: "Agenda", exact: true })).toBeVisible()
      for (const [name, value] of [
        ["Dia", "dia"],
        ["Semana", "semana"],
        ["Mês", "mes"],
      ]) {
        await page.getByRole("tab", { name, exact: true }).click()
        await expect(page).toHaveURL(new RegExp(`visao=${value}`))
      }
      await page.getByRole("button", { name: "Próximo", exact: true }).click()
      await expect(page).toHaveURL(/data=/)
      await page.getByRole("button", { name: "Hoje", exact: true }).click()
      await page.getByRole("tab", { name: "Dia", exact: true }).click()
      await noHorizontalOverflow(page)
      await nav.getByRole("link", { name: "Serviços", exact: true }).click()
      await expect(page).toHaveURL(/\/admin\/servicos$/)
      await nav
        .getByRole("link", { name: viewport.width < 1024 ? "Financeiro" : "Despesas", exact: true })
        .click()
      await expect(page).toHaveURL(/\/admin\/despesas$/)
      if (viewport.width < 1024) {
        await nav.getByRole("link", { name: "Mais", exact: true }).click()
        await expect(page).toHaveURL(/\/admin\/mais$/)
      }
      for (const route of ["disponibilidade", "portfolio", "clientes", "bio", "fundos"]) {
        const response = await page.goto(`/admin/${route}`)
        expect(response?.status()).toBe(200)
        await expect(page.locator("main h1")).toBeVisible()
        await noHorizontalOverflow(page)
      }
      await page.screenshot({ path: testInfo.outputPath("fundos.png") })
      expect(errors).toEqual([])
    })
  })
}

test("cadastro valida senha e cria conta com acesso restrito à cliente", async ({ page }) => {
  const stamp = Date.now()
  await page.goto("/cadastro")
  await page.getByLabel("Nome", { exact: true }).fill(`Cliente QA ${stamp}`)
  await page.getByLabel("WhatsApp", { exact: true }).fill(`119${String(stamp).slice(-8)}`)
  await page.getByLabel("Senha", { exact: true }).fill("cliente123")
  await page.getByLabel("Confirmar senha", { exact: true }).fill("diferente123")
  await page.getByRole("button", { name: "Criar conta", exact: true }).click()
  await expect(page.getByText("As senhas não conferem")).toBeVisible()
  await page.getByLabel("Senha", { exact: true }).fill("cliente123")
  await page.getByLabel("Confirmar senha", { exact: true }).fill("cliente123")
  await page.getByRole("button", { name: "Criar conta", exact: true }).click()
  await expect(page).toHaveURL(/\/meus-horarios/)
  await expect(page.getByRole("heading", { name: "Meus horários", exact: true })).toBeVisible()
})

test("despesa: lançar, editar, exportar CSV e excluir", async ({ page }) => {
  await loginAdmin(page)
  await page.goto("/admin/despesas?nova=1")
  const dialog = page.getByRole("dialog")
  const description = `Material QA ${Date.now()}`
  await dialog.locator('input[name="description"]').fill(description)
  await dialog.locator('input[name="amount"]').fill("42,50")
  await dialog.locator('select[name="category"]').selectOption({ index: 1 })
  await dialog.getByRole("button", { name: "Lançar despesa", exact: true }).click()
  await expect(dialog).toBeHidden()
  const row = page.getByRole("row").filter({ hasText: description })
  await expect(row).toContainText("42,50")
  await row.getByRole("button", { name: "Editar", exact: true }).click()
  await dialog.locator('input[name="amount"]').fill("55,00")
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(row).toContainText("55")
  const csv = await page.request.get("/admin/despesas/export")
  expect(csv.status()).toBe(200)
  expect(await csv.text()).toContain(description)
  page.once("dialog", (confirmation) => confirmation.accept())
  await row.getByRole("button", { name: "Excluir", exact: true }).click()
  await expect(row).toHaveCount(0)
})

test("fundos: upload, enquadramento, vínculo com tela e exclusão", async ({ page }) => {
  const db = new TestDb()
  try {
    await loginAdmin(page)
    await page.goto("/admin/fundos")
    const name = `fundo-qa-${Date.now()}`
    // PNG válido; upload e armazenamento locais reais, sem serviço externo.
    const buffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4i8AAAAASUVORK5CYII=",
      "base64",
    )
    await page
      .locator("#bg-photo-input")
      .setInputFiles({ name: `${name}.png`, mimeType: "image/png", buffer })
    await expect(page.getByRole("button", { name: `Enquadrar ${name}`, exact: true })).toBeVisible()
    await page.getByRole("button", { name: `Enquadrar ${name}`, exact: true }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("button", { name: "Salvar enquadramento" })).toBeDisabled()
    await dialog.getByRole("slider").nth(0).fill("80")
    await dialog.getByRole("slider").nth(1).fill("60")
    await dialog.getByRole("button", { name: "Celular", exact: true }).click()
    await dialog.getByRole("slider").nth(0).fill("25")
    await dialog.getByRole("slider").nth(1).fill("20")
    await dialog.getByRole("button", { name: "Salvar enquadramento" }).click()
    await expect(dialog).toBeHidden()
    const media = await db.one<{
      id: string
      url: string
      focusX: number
      focusY: number
      desktopFocusX: number
      desktopFocusY: number
    }>(
      'select id, url, "focusX", "focusY", "desktopFocusX", "desktopFocusY" from "BackgroundMedia" where name = $1',
      [name],
    )
    expect(media).not.toBeNull()
    expect(media).toMatchObject({ focusX: 25, focusY: 20, desktopFocusX: 80, desktopFocusY: 60 })
    const image = await page.request.get(media!.url)
    expect.soft(image.status(), "A imagem enviada precisa poder ser exibida").toBe(200)
    expect(image.headers()["content-type"]).toContain("image/png")
    expect(await image.body()).toEqual(buffer)
    // Escolher a primeira tela também cobre a configuração do padrão de área.
    const add = page.getByRole("button", { name: "Adicionar", exact: true }).first()
    await add.click()
    await dialog.getByRole("button", { name, exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect
      .poll(() =>
        db.count('select count(*) from "BackgroundAssignment" where "mediaId" = $1', [media!.id]),
      )
      .toBe(1)
    await page.reload()
    await expect(page.getByRole("button", { name: `Enquadrar ${name}`, exact: true })).toBeVisible()
    page.once("dialog", (confirmation) => confirmation.accept())
    await page.getByRole("button", { name: `Excluir ${name}`, exact: true }).click()
    await expect(page.getByRole("button", { name: `Enquadrar ${name}`, exact: true })).toHaveCount(
      0,
    )
    await expect
      .poll(() =>
        db.count('select count(*) from "BackgroundAssignment" where "mediaId" = $1', [media!.id]),
      )
      .toBe(0)
  } finally {
    await db.close()
  }
})

test("clientes: busca, ficha e anotação interna", async ({ page }) => {
  await loginAdmin(page)
  await page.goto("/admin/clientes")
  await page.getByRole("textbox").first().fill("Mariana")
  await expect(page).toHaveURL(/q=Mariana/)
  await page.locator('main a[href^="/admin/clientes/"]').first().click()
  const note = `Preferência registrada pelo QA ${Date.now()}`
  await page.locator("textarea").fill(note)
  await page.getByRole("button", { name: "Adicionar anotação", exact: true }).click()
  const item = page.locator("li").filter({ hasText: note })
  await expect(item).toBeVisible()
  await page.reload()
  await expect(item).toBeVisible()
  await item.getByRole("button", { name: "Remover anotação" }).click()
  await expect(item).toHaveCount(0)
})

test("cliente agenda, baixa calendário e remarca por token sem expor outro agendamento", async ({
  page,
}) => {
  const db = new TestDb()
  try {
    const service = await db.one<{ id: string }>(
      'select id from "Service" where visible = true order by "durationMin" limit 1',
    )
    await page.goto(`/agendar/${service!.id}/horario?data=${workdayAhead(40)}`)
    await selectAvailableCalendarDay(page)
    await page
      .getByRole("button", { name: /^\d{2}:\d{2}$/ })
      .first()
      .click()
    await page.getByRole("link", { name: "Continuar", exact: true }).click()
    await page.getByRole("button", { name: "Confirmar agendamento", exact: true }).click()
    await expect(page.getByLabel("Nome", { exact: true })).toHaveAttribute("aria-invalid", "true")
    await page.getByLabel("Nome", { exact: true }).fill("Cliente Remarcação QA")
    await page.getByLabel("WhatsApp", { exact: true }).fill("11912345678")
    await page.getByRole("button", { name: "Confirmar agendamento", exact: true }).click()
    await expect(page).toHaveURL(/\/agendamento\/.*\?t=/)
    const url = new URL(page.url())
    const code = url.pathname.split("/").pop()!
    const token = url.searchParams.get("t")!
    const appointment = await db.appointmentByCode(code)
    const before = await db.one<{ startsAt: Date }>(
      'select "startsAt" from "Appointment" where id = $1',
      [appointment!.id],
    )
    const calendar = await page.request.get(`${url.pathname}/ics?t=${token}`)
    expect(calendar.status()).toBe(200)
    expect(await calendar.text()).toContain("BEGIN:VCALENDAR")
    const forbidden = await page.request.get(`${url.pathname}/ics?t=token-invalido`)
    expect(forbidden.status()).toBeGreaterThanOrEqual(400)
    await page.goto(`/meus-horarios/${appointment!.id}/remarcar?t=${token}`)
    const targetDay = await selectAvailableCalendarDay(page)
    await expect(page.getByRole("heading", { level: 2 })).toContainText(
      new RegExp(`, ${Number(targetDay.slice(-2))} de `),
    )
    await expect(page.getByRole("button", { name: "Confirmar remarcação" })).toBeDisabled()
    await page
      .getByRole("button", { name: /^\d{2}:\d{2}$/ })
      .first()
      .click()
    await page.getByRole("button", { name: "Confirmar remarcação" }).click()
    await expect(page).toHaveURL(/\/meus-horarios\?t=/)
    const after = await db.one<{ startsAt: Date }>(
      'select "startsAt" from "Appointment" where id = $1',
      [appointment!.id],
    )
    expect(after!.startsAt.toISOString()).not.toBe(before!.startsAt.toISOString())
    expect(after!.startsAt.toISOString().slice(0, 10)).toBe(targetDay)
    await page.goto(`/meus-horarios/${appointment!.id}/remarcar?t=token-invalido`)
    await expect(page).toHaveURL(/\/entrar/)
  } finally {
    await db.close()
  }
})
