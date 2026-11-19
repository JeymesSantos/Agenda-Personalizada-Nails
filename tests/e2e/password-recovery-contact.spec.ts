import { expect, test } from "@playwright/test"
import { TestDb } from "./helpers"

const db = new TestDb()
test.afterAll(() => db.close())

for (const width of [390, 1440]) {
  test(`recuperação escolhe contato válido e trata ausência de WhatsApp (${width}px)`, async ({
    page,
  }, testInfo) => {
    const business = await db.one<{
      id: string
      ownerId: string
      whatsapp: string | null
      adminWhatsapp: string | null
    }>(
      `select b.id, b."ownerId", b.whatsapp, u.whatsapp as "adminWhatsapp"
       from "Business" b join "User" u on u.id = b."ownerId"
       order by b."createdAt" limit 1`,
    )
    expect(business).not.toBeNull()
    await page.setViewportSize({ width, height: 1000 })
    const cases = [
      { studio: "+55 (11) 97000-0001", admin: "11970000002", expected: "11970000001" },
      { studio: null, admin: "11970000002", expected: "11970000002" },
      { studio: "inválido", admin: "11970000002", expected: "11970000002" },
      { studio: null, admin: null, expected: null },
      { studio: "inválido", admin: "inválido", expected: null },
    ]
    try {
      for (const [index, scenario] of cases.entries()) {
        await db.one('update "Business" set whatsapp = $2 where id = $1', [
          business!.id,
          scenario.studio,
        ])
        await db.one('update "User" set whatsapp = $2 where id = $1', [
          business!.ownerId,
          scenario.admin,
        ])
        await page.goto("/recuperar-senha")
        const request = page.getByRole("link", { name: "Recuperar senha", exact: true })
        if (scenario.expected) {
          await expect(request).toBeVisible()
          const url = new URL((await request.getAttribute("href"))!)
          expect(url.origin).toBe("https://wa.me")
          expect(url.pathname).toBe(`/55${scenario.expected}`)
          expect(url.searchParams.get("text")).toBe(
            "Olá! Esqueci minha senha e gostaria de receber um link para recuperar o acesso à minha conta.",
          )
          await expect(
            page.getByRole("button", { name: "Recuperar senha", exact: true }),
          ).toHaveCount(0)
        } else {
          await expect(request).toHaveCount(0)
          await expect(
            page.getByRole("button", { name: "Recuperar senha", exact: true }),
          ).toBeDisabled()
          await expect(
            page.getByText("O WhatsApp do studio ainda não está disponível."),
          ).toBeVisible()
        }
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        ).toBe(false)
        if (index === 0 || index === 3) {
          await page.screenshot({
            path: testInfo.outputPath(`recuperacao-${index}-${width}.png`),
            fullPage: true,
          })
        }
        await page.getByRole("link", { name: "Agendar sem entrar", exact: true }).click()
        await expect(page).toHaveURL(/\/servicos$/)
        await expect(
          page.getByRole("heading", { name: "Serviços e valores", exact: true }),
        ).toBeVisible()
      }
    } finally {
      await db.one('update "Business" set whatsapp = $2 where id = $1', [
        business!.id,
        business!.whatsapp,
      ])
      await db.one('update "User" set whatsapp = $2 where id = $1', [
        business!.ownerId,
        business!.adminWhatsapp,
      ])
    }
  })
}
