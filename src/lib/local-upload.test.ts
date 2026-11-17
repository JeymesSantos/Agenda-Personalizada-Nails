import { mkdtemp, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
import { serveLocalUpload } from "./local-upload"

describe("uploads locais após o build", () => {
  let root: string
  beforeAll(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), "agenda-upload-test-"))
    await writeFile(path.join(root, "foto.png"), Buffer.from([1, 2, 3, 4]))
  })
  afterAll(async () => {
    if (root) {
      const resolved = path.resolve(root)
      const prefix = path.resolve(os.tmpdir()) + path.sep + "agenda-upload-test-"
      if (!resolved.startsWith(prefix)) throw new Error("Unexpected test directory")
      await rm(resolved, { recursive: true, force: true })
    }
  })
  const request = (method = "GET", range?: string) =>
    new Request("http://localhost/uploads/foto.png", {
      method,
      headers: range ? { range } : undefined,
    })
  it("serve o arquivo salvo e os cabeçalhos de HEAD", async () => {
    const response = await serveLocalUpload(request(), ["foto.png"], root)
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("image/png")
    expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([1, 2, 3, 4])
    const head = await serveLocalUpload(request("HEAD"), ["foto.png"], root)
    expect(head.headers.get("content-length")).toBe("4")
    expect(await head.text()).toBe("")
  })
  it("suporta leitura parcial e rejeita intervalos inválidos", async () => {
    const partial = await serveLocalUpload(request("GET", "bytes=1-2"), ["foto.png"], root)
    expect(partial.status).toBe(206)
    expect(partial.headers.get("content-range")).toBe("bytes 1-2/4")
    expect([...new Uint8Array(await partial.arrayBuffer())]).toEqual([2, 3])
    expect((await serveLocalUpload(request("GET", "bytes=8-9"), ["foto.png"], root)).status).toBe(
      416,
    )
  })
  it("barra caminhos externos, tipos não permitidos e arquivos ausentes", async () => {
    for (const segments of [
      ["..", "foto.png"],
      ["../foto.png"],
      ["pasta\\foto.png"],
      [".env"],
      ["ausente.png"],
    ])
      expect((await serveLocalUpload(request(), segments, root)).status).toBe(404)
  })
})
