import { expect, test } from "@playwright/test"
import { loginAdmin, TestDb } from "./helpers"

test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" })

test("editor arrasta, amplia e preserva ajustes independentes no desktop e celular", async ({
  page,
}, testInfo) => {
  const db = new TestDb()
  const original = await db.one<{
    id: string
    url: string
    framing: unknown
    focusX: number
    focusY: number
    desktopFocusX: number | null
    desktopFocusY: number | null
  }>("select * from \"BackgroundMedia\" where name = 'Studio 1'")
  const other = await db.one<{ id: string; framing: unknown }>(
    "select id, framing from \"BackgroundMedia\" where name = 'Studio 2'",
  )
  const count = await db.count('select count(*) from "BackgroundMedia"')
  try {
    await loginAdmin(page)
    await page.goto("/admin/fundos")
    await page.getByRole("button", { name: "Enquadrar Studio 1", exact: true }).click()
    const dialog = page.getByRole("dialog")
    const stage = dialog.getByTestId("framing-stage")
    const image = stage.locator("img")
    await expect
      .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0)
    await dialog.getByRole("button", { name: "Restaurar enquadramento", exact: true }).click()
    await dialog.getByRole("slider").nth(2).fill("150")
    const area = (await stage.boundingBox())!
    await page.mouse.move(area.x + area.width / 2, area.y + area.height / 2)
    await page.mouse.down()
    await page.mouse.move(area.x + area.width / 2 + 25, area.y + area.height / 2 + 25, { steps: 5 })
    await page.mouse.up()
    await expect(dialog.getByRole("slider").nth(0)).not.toHaveValue("50")
    const desktopX = await dialog.getByRole("slider").nth(0).inputValue()
    const desktopY = await dialog.getByRole("slider").nth(1).inputValue()
    await expect(image).toHaveCSS("transform", "matrix(1.5, 0, 0, 1.5, 0, 0)")
    await dialog.getByLabel("Formato da prévia", { exact: true }).selectOption("21:9")
    const ultrawide = (await stage.boundingBox())!
    expect(ultrawide.width / ultrawide.height).toBeCloseTo(21 / 9, 1)
    await page.screenshot({ path: testInfo.outputPath("editor-desktop.png"), fullPage: true })
    await dialog.getByRole("button", { name: "Celular", exact: true }).click()
    await dialog.getByRole("button", { name: "Mostrar imagem inteira", exact: true }).click()
    await expect(dialog.getByRole("slider").nth(2)).toBeDisabled()
    await expect(image).toHaveCSS("object-fit", "contain")
    await dialog.getByRole("slider").nth(0).fill("25")
    await dialog.getByRole("slider").nth(1).fill("20")
    await dialog.getByRole("button", { name: "Computador", exact: true }).click()
    await expect(dialog.getByRole("slider").nth(0)).toHaveValue(desktopX)
    await expect(dialog.getByRole("slider").nth(2)).toHaveValue("150")
    await dialog.getByRole("button", { name: "Salvar enquadramento", exact: true }).click()
    await expect(dialog).toBeHidden()
    const saved = await db.one<{ framing: unknown; url: string }>(
      'select framing, url from "BackgroundMedia" where id = $1',
      [original!.id],
    )
    expect(saved).toEqual({
      url: original!.url,
      framing: {
        mobile: { x: 25, y: 20, zoom: 1, fit: "contain" },
        desktop: { x: Number(desktopX), y: Number(desktopY), zoom: 1.5, fit: "cover" },
      },
    })
    expect(
      await db.one('select id, framing from "BackgroundMedia" where id = $1', [other!.id]),
    ).toEqual(other)
    expect(await db.count('select count(*) from "BackgroundMedia"')).toBe(count)
    await page.goto("/")
    const background = page.locator(".bg-media").first()
    await expect(background).toHaveCSS("object-position", `${desktopX}% ${desktopY}%`)
    await expect(background).toHaveCSS("transform", "matrix(1.5, 0, 0, 1.5, 0, 0)")
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(background).toHaveCSS("object-fit", "contain")
    await expect(background).toHaveCSS("object-position", "25% 20%")
    await expect(background).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)")
    await page.goto("/admin/fundos")
    await page.getByRole("button", { name: "Enquadrar Studio 1", exact: true }).click()
    await dialog.getByRole("button", { name: "Celular", exact: true }).click()
    await expect(dialog.getByRole("slider").nth(0)).toHaveValue("25")
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath("editor-celular.png"), fullPage: true })
    await dialog.getByRole("button", { name: "Restaurar enquadramento", exact: true }).click()
    await expect(dialog.getByRole("slider").nth(0)).toHaveValue("50")
    await dialog.getByRole("button", { name: "Cancelar", exact: true }).click()
    expect(
      (await db.one<{ framing: unknown }>('select framing from "BackgroundMedia" where id = $1', [
        original!.id,
      ]))!.framing,
    ).toEqual(saved!.framing)
  } finally {
    await db.one(
      'update "BackgroundMedia" set framing = $2, "focusX" = $3, "focusY" = $4, "desktopFocusX" = $5, "desktopFocusY" = $6 where id = $1',
      [
        original!.id,
        JSON.stringify(original!.framing),
        original!.focusX,
        original!.focusY,
        original!.desktopFocusX,
        original!.desktopFocusY,
      ],
    )
    await db.close()
  }
})

test("foto de serviço mantém o arquivo e aplica zoom e encaixe no catálogo", async ({
  page,
}, testInfo) => {
  const db = new TestDb()
  const service = await db.one<{
    id: string
    title: string
    photoUrls: string[]
    photoFocus: unknown
  }>(
    'select id, title, "photoUrls", "photoFocus" from "Service" where visible = true and cardinality("photoUrls") > 0 order by "createdAt" limit 1',
  )
  try {
    await loginAdmin(page)
    await page.goto(`/admin/servicos/${service!.id}`)
    await page
      .getByRole("button", { name: "Ajustar enquadramento da foto", exact: true })
      .first()
      .click()
    const dialog = page.getByRole("dialog")
    await dialog.getByRole("slider").nth(0).fill("80")
    await dialog.getByRole("slider").nth(1).fill("60")
    await dialog.getByRole("slider").nth(2).fill("175")
    await dialog.getByRole("button", { name: "Celular", exact: true }).click()
    await dialog.getByRole("button", { name: "Mostrar imagem inteira", exact: true }).click()
    await dialog.getByRole("slider").nth(0).fill("20")
    await dialog.getByRole("button", { name: "Aplicar enquadramento", exact: true }).click()
    await page.getByRole("button", { name: "Salvar serviço", exact: true }).click()
    await expect(page).toHaveURL(/\/admin\/servicos\?salvo=1/)
    const saved = await db.one<{ photoUrls: string[]; photoFocus: Record<string, unknown> }>(
      'select "photoUrls", "photoFocus" from "Service" where id = $1',
      [service!.id],
    )
    expect(saved!.photoUrls).toEqual(service!.photoUrls)
    expect(saved!.photoFocus[service!.photoUrls[0]]).toMatchObject({
      x: 20,
      zoom: 1,
      fit: "contain",
      desktop: { x: 80, y: 60, zoom: 1.75, fit: "cover" },
    })
    await page.goto("/servicos")
    const card = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: service!.title, exact: true }) })
    const photo = card.locator("img")
    await expect(photo).toHaveCSS("object-position", "80% 60%")
    await expect(photo).toHaveCSS("transform", "matrix(1.75, 0, 0, 1.75, 0, 0)")
    await expect(photo.locator("..")).toHaveCSS("overflow", "hidden")
    await page.screenshot({ path: testInfo.outputPath("catalogo-desktop.png"), fullPage: true })
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(photo).toHaveCSS("object-fit", "contain")
    await expect(photo).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)")
  } finally {
    await db.one('update "Service" set "photoFocus" = $2 where id = $1', [
      service!.id,
      JSON.stringify(service!.photoFocus),
    ])
    await db.close()
  }
})
