import { expect, test } from "@playwright/test"

test("instalação exige clique, permite recusa e oculta a opção após instalar", async ({ page }) => {
  await page.goto("/")
  const button = page.getByRole("button", { name: "Instalar aplicativo", exact: true })
  await expect(button).toBeVisible()
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true })
    Object.assign(event, {
      prompt: async () => {
        document.documentElement.dataset.installPrompted = "true"
      },
      userChoice: Promise.resolve({ outcome: "dismissed" }),
    })
    window.dispatchEvent(event)
  })
  await expect(page.locator("html")).not.toHaveAttribute("data-install-prompted")
  await button.click()
  await expect(page.locator("html")).toHaveAttribute("data-install-prompted", "true")
  await expect(button).toBeEnabled()
  // O evento só pode ser usado uma vez; uma nova tentativa oferece orientação.
  await button.click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.getByRole("button", { name: "Fechar", exact: true }).click()
  await expect(button).toBeFocused()
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")))
  await expect(button).toHaveCount(0)
})

test("falha ao abrir a confirmação oferece instruções", async ({ page }) => {
  await page.goto("/")
  const button = page.getByRole("button", { name: "Instalar aplicativo", exact: true })
  await expect(button).toBeVisible()
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true })
    Object.assign(event, {
      prompt: async () => {
        throw new Error("Indisponível")
      },
      userChoice: Promise.resolve({ outcome: "dismissed" }),
    })
    window.dispatchEvent(event)
  })
  await button.click()
  await expect(page.getByRole("dialog")).toBeVisible()
})

test("aplicativo aberto em modo independente não oferece instalação", async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window)
    window.matchMedia = (query) => {
      const result = original(query)
      if (query === "(display-mode: standalone)") {
        Object.defineProperty(result, "matches", { value: true })
      }
      return result
    }
  })
  await page.goto("/")
  await expect(
    page.getByRole("link", { name: "Agendar horário", exact: true }).first(),
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "Instalar aplicativo" })).toHaveCount(0)
})

for (const width of [320, 390, 768, 1440]) {
  test(`instruções de instalação acessíveis em ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "userAgent", { value: "iPhone" })
    })
    await page.goto("/")
    await page.getByRole("button", { name: "Instalar aplicativo", exact: true }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/Abra este site no Safari/)).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`instalar-${width}.png`) })
    await page.keyboard.press("Escape")
    await expect(dialog).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Instalar aplicativo", exact: true }),
    ).toBeFocused()
  })
}
