import { expect, test } from "@playwright/test"
import { loginAdmin, TestDb } from "./helpers"

const db = new TestDb()
test.afterAll(() => db.close())

for (const registered of [true, false]) {
  test(`mensagem de ${registered ? "recuperação" : "convite"} não alarga a ficha da cliente`, async ({
    page,
  }, testInfo) => {
    const client = await db.one<{ id: string }>(
      `select u.id from "User" u where u.role = 'CLIENT' and u.whatsapp is not null
       and (u."passwordHash" is not null) = $1
       and exists(select 1 from "Appointment" a where a."clientId" = u.id)
       order by length(u.id) desc, u.id limit 1`,
      [registered],
    )
    expect(client).not.toBeNull()
    await loginAdmin(page)
    for (const width of [320, 390, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(`/admin/clientes/${client!.id}`)
      await page
        .getByRole("button", {
          name: registered ? "Enviar link de recuperação" : "Enviar convite para criar conta",
          exact: true,
        })
        .click()
      await expect(page.getByRole("link", { name: "Abrir WhatsApp para enviar" })).toBeVisible()
      const preview = page.locator('main [aria-live="polite"]')
      await expect(preview).toContainText(
        registered ? "/redefinir-senha?token=" : "/cadastro?convite=",
      )
      const dimensions = await page.evaluate(() => ({
        pageWidth: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
        overflowing: Array.from(
          document.querySelectorAll('main [aria-live="polite"], main [data-slot="card"]'),
        ).some((el) => el.scrollWidth > el.clientWidth + 1),
        outsideMain: Array.from(document.querySelectorAll('main [data-slot="card"]')).some(
          (el) =>
            el.getBoundingClientRect().right >
            document.querySelector("main")!.getBoundingClientRect().right + 1,
        ),
      }))
      expect(dimensions.pageWidth, `Ficha ultrapassa a tela em ${width}px`).toBeLessThanOrEqual(
        dimensions.viewport + 1,
      )
      expect(dimensions.overflowing, `Mensagem ou card ultrapassa sua largura em ${width}px`).toBe(
        false,
      )
      expect(dimensions.outsideMain, `Colunas ultrapassam a ficha em ${width}px`).toBe(false)
      await expect(page.getByRole("button", { name: "Copiar mensagem com link" })).toBeVisible()
      await page.screenshot({ path: testInfo.outputPath(`acesso-${width}.png`), fullPage: true })
    }
  })
}
