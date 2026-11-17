import { expect, test } from "@playwright/test"
import { loginAdmin, TestDb, workdayAhead } from "./helpers"

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 1000 },
]) {
  test.describe(`ajustes ${viewport.width}px`, () => {
    test.use({ viewport })
    test("almoço, fechar disponibilidade, enquadramento e telefone", async ({ page }, testInfo) => {
      await loginAdmin(page)
      await page.goto("/admin/disponibilidade")
      await page.getByLabel("Segunda: início do almoço", { exact: true }).fill("12:15")
      await page.getByLabel("Segunda: fim do almoço", { exact: true }).fill("13:30")
      await page.getByRole("button", { name: "Salvar horários", exact: true }).click()
      await expect(page.getByText("Horário de funcionamento salvo.", { exact: true })).toBeVisible()
      await page.reload()
      await expect(page.getByLabel("Segunda: início do almoço", { exact: true })).toHaveValue(
        "12:15",
      )
      await page.screenshot({ path: testInfo.outputPath("disponibilidade.png"), fullPage: true })
      await page.getByRole("link", { name: "Fechar", exact: true }).click()
      await expect(page).toHaveURL(/\/admin\/agenda$/)

      await page.goto("/admin/fundos")
      await page.getByRole("button", { name: "Enquadrar Studio 1", exact: true }).click()
      const dialog = page.getByRole("dialog")
      await dialog
        .getByRole("slider")
        .nth(0)
        .fill(viewport.width >= 1024 ? "80" : "79")
      await dialog.getByRole("slider").nth(1).fill("60")
      await dialog.getByRole("button", { name: "Celular", exact: true }).click()
      await dialog.getByRole("slider").nth(0).fill("25")
      await dialog.getByRole("slider").nth(1).fill("20")
      await page.screenshot({ path: testInfo.outputPath("enquadramento.png"), fullPage: true })
      await dialog.getByRole("button", { name: "Salvar enquadramento", exact: true }).click()
      await expect(dialog).toBeHidden()
      await page.goto("/")
      const media = page.locator(".bg-slide .bg-media").first()
      await expect(media).toHaveCSS(
        "object-position",
        viewport.width >= 1024 ? "80% 60%" : "25% 20%",
      )

      await page.goto("/admin/servicos")
      await page
        .locator('main a[href^="/admin/servicos/"]')
        .filter({ hasNotText: "Novo" })
        .first()
        .click()
      await page
        .getByRole("button", { name: "Ajustar enquadramento da foto", exact: true })
        .first()
        .click()
      await dialog.getByRole("slider").first().fill("70")
      await dialog.getByRole("button", { name: "Aplicar enquadramento", exact: true }).click()
      await page.getByRole("button", { name: "Salvar serviço", exact: true }).click()
      await expect(page).toHaveURL(/\/admin\/servicos\?salvo=1/)
      await page.goto("/admin/bio")
      const phone = page.locator('input[name="whatsapp"]')
      await phone.fill("+55 11 99988-7766")
      await expect(phone).toHaveValue("(11) 99988-7766")
    })

    test("liberação não sobrepõe almoço e remoção do fundo é por página", async ({
      page,
    }, testInfo) => {
      const db = new TestDb()
      try {
        const business = await db.one<{ id: string }>(
          'select id from "Business" order by "createdAt" limit 1',
        )
        const date = workdayAhead(35)
        await db.one(
          `insert into "ScheduleException" (id, "businessId", type, "startsAt", "endsAt", "allDay", reason, "createdAt") values ($1, $2, 'RELEASE', ($3::timestamptz at time zone 'UTC'), ($4::timestamptz at time zone 'UTC'), false, 'Sem almoço neste horário', now()) returning id`,
          [
            `release-${viewport.width}`,
            business!.id,
            `${date}T13:00:00-03:00`,
            `${date}T19:00:00-03:00`,
          ],
        )
        await loginAdmin(page)
        await page.goto(`/admin/agenda?visao=dia&data=${date}`)
        const lunch = page.locator('[title^="Almoço ·"]')
        const release = page.locator('[title^="Liberado ·"]')
        await expect(lunch).toBeVisible()
        await expect(release).toBeVisible()
        const a = await lunch.boundingBox(),
          b = await release.boundingBox()
        expect(a!.y + a!.height).toBeLessThanOrEqual(b!.y)
        await page.screenshot({
          path: testInfo.outputPath("agenda-sem-sobreposicao.png"),
          fullPage: true,
        })
        await page.goto("/admin/fundos")
        for (let i = 1; i <= 5; i++) {
          await page
            .getByRole("button", { name: `Remover Studio ${i} de Início`, exact: true })
            .click()
          await expect(
            page.getByRole("button", { name: `Remover Studio ${i} de Início`, exact: true }),
          ).toHaveCount(0)
        }
        await page.goto("/")
        await expect(page.locator(".bg-slideshow")).toHaveCount(0)
        await page.goto("/servicos")
        await expect(page.locator(".bg-slideshow")).toBeVisible()
        await page.goto("/admin/fundos")
        const home = page
          .locator("main li")
          .filter({ has: page.getByText("Início", { exact: true }) })
          .last()
        await home.getByRole("button", { name: "Voltar ao padrão", exact: true }).click()
        await expect(home.getByText("Usa o padrão", { exact: true })).toBeVisible()
      } finally {
        await db.close()
      }
    })
  })
}
