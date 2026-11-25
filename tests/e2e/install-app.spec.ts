import { expect, test } from "@playwright/test"

import { TestDb, loginAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
})

test("painel instala com identidade própria e mantém a exigência de login", async ({
  page,
  request,
}) => {
  const publicManifest = await (await request.get("/manifest.webmanifest")).json()
  const response = await request.get("/painel.webmanifest")
  expect(response.ok()).toBe(true)
  expect(response.headers()["content-type"]).toContain("application/manifest+json")
  const adminManifest = await response.json()
  expect(adminManifest.id).not.toBe(publicManifest.id)
  expect(adminManifest.start_url).toBe("/admin")
  expect(adminManifest.scope).toBe("/admin")
  await page.goto(adminManifest.start_url)
  await expect(page).toHaveURL(/\/admin\/entrar/)
  await loginAdmin(page)
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/painel.webmanifest")
})

test("API nativa é chamada pelo clique e oculta a oferta após aprovação", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "install", {
      value: async () => {
        document.documentElement.dataset.nativeInstall = "called"
      },
    })
  })
  await page.goto("/")
  const button = page.getByRole("button", { name: "Instalar app", exact: true })
  await expect(button).toBeVisible()
  await expect(page.locator("html")).not.toHaveAttribute("data-native-install")
  await button.click()
  await expect(page.locator("html")).toHaveAttribute("data-native-install", "called")
  await expect(button).toHaveCount(0)
})

test("cancelar a API nativa permite uma nova tentativa sem abrir instruções", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "install", {
      value: async () => {
        throw new DOMException("Cancelado", "AbortError")
      },
    })
  })
  await openClientCard(page)
  const button = page.getByRole("button", { name: "Instalar", exact: true })
  await button.click()
  await expect(page.getByRole("status").filter({ hasText: "Instalação cancelada" })).toBeVisible()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(button).toBeEnabled()
  await button.click()
  await expect(button).toBeEnabled()
})

test("navegador interno orienta abrir no navegador, mesmo com API disponível", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userAgent", { value: "iPhone Instagram" })
    Object.defineProperty(navigator, "install", {
      value: async () => {
        document.documentElement.dataset.nativeInstall = "called"
      },
    })
  })
  await page.goto("/")
  await page.getByRole("button", { name: "Instalar app", exact: true }).click()
  await expect(page.getByRole("dialog").getByText(/navegador de outro aplicativo/)).toBeVisible()
  await expect(page.locator("html")).not.toHaveAttribute("data-native-install")
})

test.describe("Navegadores sem API nativa", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "install", { value: undefined })
    })
  })

  test("instalação exige clique, permite recusa e oculta a opção após instalar", async ({
    page,
  }) => {
    await page.goto("/")
    const button = page.getByRole("button", { name: "Instalar app", exact: true })
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
    const button = page.getByRole("button", { name: "Instalar app", exact: true })
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
    await expect(page.getByRole("button", { name: "Instalar app" })).toHaveCount(0)
  })

  for (const width of [320, 390, 768, 1440]) {
    test(`instruções de instalação acessíveis em ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "userAgent", { value: "iPhone" })
      })
      await openClientCard(page)
      const card = page.getByRole("region", { name: "Instalar aplicativo" })
      await expect(card).toBeVisible()
      await expect(card.getByText("Adicionar à Tela de Início", { exact: true })).toBeVisible()
      if (width < 1024) {
        await expect(page.getByRole("button", { name: "Instalar app", exact: true })).toBeHidden()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        )
        await page.screenshot({ path: testInfo.outputPath(`instalar-${width}.png`) })
        return
      }
      await page.getByRole("button", { name: "Instalar app", exact: true }).click()
      const dialog = page.getByRole("dialog")
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText(/Abra este site no Safari/)).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      await page.screenshot({ path: testInfo.outputPath(`instalar-${width}.png`) })
      await page.keyboard.press("Escape")
      await expect(dialog).toHaveCount(0)
      await expect(page.getByRole("button", { name: "Instalar app", exact: true })).toBeFocused()
    })
  }
})

async function openClientCard(page: import("@playwright/test").Page) {
  const db = new TestDb()
  try {
    const appointment = await db.one<{ manageToken: string }>(
      'select "manageToken" from "Appointment" order by "createdAt" limit 1',
    )
    if (!appointment) throw new Error("Seed sem agendamento")
    await page.goto("/meus-horarios?t=" + appointment.manageToken)
  } finally {
    await db.close()
  }
}

test("evento capturado continua disponível após navegação cliente", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "install", { value: undefined }))
  await page.goto("/")
  await expect(page.getByRole("button", { name: "Instalar app", exact: true })).toBeVisible()
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true })
    Object.assign(event, {
      prompt: async () => {
        document.documentElement.dataset.installPrompted = "true"
      },
      userChoice: Promise.resolve({ outcome: "dismissed" }),
    })
    window.dispatchEvent(event)
    document.documentElement.dataset.navigationMarker = "preserved"
  })
  await page
    .getByRole("navigation", { name: "Páginas" })
    .getByRole("link", { name: "Portfólio" })
    .click()
  await expect(page).toHaveURL(/portfolio/)
  await expect(page.locator("html")).toHaveAttribute("data-navigation-marker", "preserved")
  await page.getByRole("button", { name: "Instalar app", exact: true }).click()
  await expect(page.locator("html")).toHaveAttribute("data-install-prompted", "true")
})

test("dispensa dura sete dias e preserva header e sidebar", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "install", { value: async () => {} }),
  )
  await openClientCard(page)
  const card = page.getByRole("region", { name: "Instalar aplicativo" })
  await card.getByRole("button", { name: "Agora não" }).click()
  await expect(card).toHaveCount(0)
  const until = await page.evaluate(() =>
    Number(localStorage.getItem("install-card-dismissed-until")),
  )
  expect(until - Date.now()).toBeGreaterThan(6.99 * 86400000)
  expect(until - Date.now()).toBeLessThanOrEqual(7 * 86400000)
  await page.reload()
  await expect(card).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Instalar app", exact: true })).toBeVisible()
  await loginAdmin(page)
  await expect(
    page.locator('[data-slot="sidebar"]').getByRole("button", { name: "Instalar app" }),
  ).toBeVisible()
  await page.evaluate(() =>
    localStorage.setItem("install-card-dismissed-until", String(Date.now() - 1)),
  )
  await openClientCard(page)
  await expect(card).toBeVisible()
})

test("iOS dispensa com Entendi e navegador interno ignora dispensa", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "install", { value: undefined })
    Object.defineProperty(navigator, "userAgent", {
      value: "iPhone Safari/604.1",
      configurable: true,
    })
  })
  await openClientCard(page)
  await page.getByRole("button", { name: "Entendi", exact: true }).click()
  await page.reload()
  await expect(page.getByRole("region", { name: "Instalar aplicativo" })).toHaveCount(0)
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "userAgent", { value: "iPhone Instagram" }),
  )
  await page.reload()
  await page.getByRole("button", { name: "Como abrir no navegador" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("button", { name: "Como abrir no navegador" })).toBeFocused()
})

for (const width of [320, 390, 768, 1024, 1440]) {
  test("telas contextuais sem overflow em " + width + "px", async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "install", { value: async () => {} }),
    )
    const db = new TestDb()
    let receipt = ""
    try {
      const a = await db.one<{ code: string; manageToken: string }>(
        'select code, "manageToken" from "Appointment" where status = \'CONFIRMED\' limit 1',
      )
      if (!a) throw new Error("Seed sem comprovante")
      receipt = "/agendamento/" + a.code + "?t=" + a.manageToken
    } finally {
      await db.close()
    }
    for (const screen of ["M6", "M7", "AM1", "D1"]) {
      if (screen === "M6") await page.goto(receipt)
      if (screen === "M7") await openClientCard(page)
      if (screen === "AM1") await loginAdmin(page)
      if (screen === "D1") await page.goto("/")
      const card = page.getByRole("region", { name: "Instalar aplicativo" })
      if (screen !== "D1" && (screen !== "AM1" || width < 1024)) {
        await expect(card).toBeVisible()
        await card.scrollIntoViewIfNeeded()
        const box = await card.boundingBox()
        expect(box!.y + box!.height).toBeLessThanOrEqual(900 - (width < 1024 ? 70 : 0))
        expect(
          await card
            .getByRole("button", { name: "Instalar", exact: true })
            .evaluate((el) => el.getBoundingClientRect().height),
        ).toBe(44)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      if (screen === "D1" && width >= 1024) {
        const header = page.locator('[data-slot="public-header"]')
        const brand = await header.getByRole("link").first().boundingBox()
        const firstLink = await header
          .getByRole("navigation")
          .getByRole("link")
          .first()
          .boundingBox()
        expect(brand!.x + brand!.width).toBeLessThanOrEqual(firstLink!.x)
      }
      await page.screenshot({ path: testInfo.outputPath(screen + "-" + width + ".png") })
    }
  })
}
