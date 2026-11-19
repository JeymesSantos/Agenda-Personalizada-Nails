import { expect, test } from "@playwright/test"
import { loginAdmin, TestDb } from "./helpers"

const db = new TestDb()
test.afterAll(() => db.close())

test("envia um clipe, reproduz no portfólio e permite excluir", async ({ page }) => {
  await loginAdmin(page)
  await page.goto("/admin/portfolio")
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 128
    const ctx = canvas.getContext("2d")!
    const stream = canvas.captureStream(12)
    const recorder = new MediaRecorder(stream, { mimeType: "video/mp4" })
    const chunks: Blob[] = []
    recorder.ondataavailable = (event) => chunks.push(event.data)
    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
    })
    recorder.start()
    for (let i = 0; i < 15; i++) {
      ctx.fillStyle = i % 2 ? "#e51c98" : "#f5a7d7"
      ctx.fillRect(0, 0, 128, 128)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    recorder.stop()
    await stopped
    stream.getTracks().forEach((track) => track.stop())
    return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()))
  })
  const buffer = Buffer.from(bytes)
  // MediaRecorder writes fragmented MP4 with an unspecified movie duration.
  // Give this deterministic test fixture a 1.5-second movie header.
  const mvhd = buffer.indexOf(Buffer.from("mvhd")) + 4
  expect(mvhd).toBeGreaterThan(4)
  const scaleAt = mvhd + (buffer[mvhd] === 1 ? 20 : 12)
  const duration = Math.round(buffer.readUInt32BE(scaleAt) * 1.5)
  if (buffer[mvhd] === 1) buffer.writeBigUInt64BE(BigInt(duration), scaleAt + 4)
  else buffer.writeUInt32BE(duration, scaleAt + 4)

  await page
    .getByTestId("portfolio-upload")
    .setInputFiles({ name: "loop.mp4", mimeType: "video/mp4", buffer })
  await expect(page.getByText("1 arquivo enviado.", { exact: true })).toBeVisible()
  await expect(page).toHaveURL(/foto=/)
  const id = new URL(page.url()).searchParams.get("foto")!
  const saved = await db.one<{ url: string }>('select url from "Photo" where id = $1', [id])
  expect(saved?.url).toMatch(/\.mp4$/)
  await page.goto(`/portfolio?foto=${id}`)
  const video = page.locator("section video").first()
  await expect(video).toBeVisible()
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState))
    .toBeGreaterThanOrEqual(2)
  await expect(video).toHaveJSProperty("loop", true)
  await expect(video).toHaveJSProperty("muted", true)
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
    .toBeGreaterThan(0)
  await page.emulateMedia({ reducedMotion: "reduce" })
  await expect(video).toHaveJSProperty("controls", true)
  await expect(video).toHaveJSProperty("paused", true)
  await page.goto(`/admin/portfolio?foto=${id}`)
  page.once("dialog", (dialog) => dialog.accept())
  await page.getByRole("button", { name: "Excluir", exact: true }).last().click()
  await expect.poll(() => db.count('select count(*) from "Photo" where id = $1', [id])).toBe(0)
})

test("upload exige admin e rejeita vídeos inválidos", async ({ page, request }) => {
  expect((await request.post("/api/uploads/portfolio")).status()).toBe(401)
  await loginAdmin(page)
  const response = await page.request.post("/api/uploads/portfolio", {
    multipart: {
      file: { name: "invalid.mp4", mimeType: "video/mp4", buffer: Buffer.from("invalid") },
    },
  })
  expect(response.status()).toBe(400)
  expect((await response.json()).error).toContain("MP4 válido")
})
