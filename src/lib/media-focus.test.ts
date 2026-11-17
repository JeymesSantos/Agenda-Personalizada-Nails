import { describe, expect, it } from "vitest"
import { backgroundFraming, DEFAULT_FRAME, dragFrame, photoFraming, readFrame } from "./media-focus"
import { mediaFrameSchema, photoFocusSchema } from "./media-framing-schema"

describe("enquadramento por mídia", () => {
  it("mantém os enquadramentos antigos sem alterar os arquivos", () => {
    expect(
      backgroundFraming({ focusX: 20, focusY: 30, desktopFocusX: 80, desktopFocusY: null }),
    ).toEqual({
      mobile: { ...DEFAULT_FRAME, x: 20, y: 30 },
      desktop: { ...DEFAULT_FRAME, x: 80, y: 30 },
    })
    expect(photoFraming({ a: { x: 10, y: 90 } }, "a")).toEqual({
      mobile: { ...DEFAULT_FRAME, x: 10, y: 90 },
      desktop: { ...DEFAULT_FRAME, x: 10, y: 90 },
    })
  })

  it("separa cada foto e cada tipo de tela", () => {
    const desktop = { x: 80, y: 60, zoom: 1.5, fit: "cover" as const }
    const focus = { a: { x: 20, y: 30, fit: "contain", zoom: 1, desktop }, b: { x: 70, y: 80 } }
    expect(photoFraming(focus, "a")).toEqual({
      mobile: { x: 20, y: 30, fit: "contain", zoom: 1 },
      desktop,
    })
    expect(photoFraming(focus, "b").desktop).toEqual({ ...DEFAULT_FRAME, x: 70, y: 80 })
    expect(photoFraming(focus, "ausente").mobile).toEqual(DEFAULT_FRAME)
  })

  it("traduz arraste em pixels para o deslocamento real da imagem ampliada", () => {
    // A 200×100 image covers 100×100: 100px overflow, so dragging right moves x backwards.
    expect(
      dragFrame(DEFAULT_FRAME, { width: 100, height: 100 }, { width: 200, height: 100 }, 20, 30),
    ).toEqual({ ...DEFAULT_FRAME, x: 30 })
    expect(
      dragFrame(
        { ...DEFAULT_FRAME, zoom: 2 },
        { width: 100, height: 100 },
        { width: 100, height: 100 },
        -10,
        20,
      ),
    ).toEqual({ ...DEFAULT_FRAME, zoom: 2, x: 60, y: 30 })
    expect(
      dragFrame(DEFAULT_FRAME, { width: 100, height: 100 }, { width: 200, height: 100 }, 900, 0).x,
    ).toBe(0)
  })

  it("posiciona a imagem inteira nos espaços livres sem cortá-la", () => {
    expect(
      dragFrame(
        { ...DEFAULT_FRAME, fit: "contain" },
        { width: 100, height: 100 },
        { width: 200, height: 100 },
        20,
        10,
      ),
    ).toEqual({ ...DEFAULT_FRAME, fit: "contain", y: 70 })
    expect(
      dragFrame(DEFAULT_FRAME, { width: 0, height: 100 }, { width: 200, height: 100 }, 20, 10),
    ).toEqual(DEFAULT_FRAME)
  })

  it("rejeita valores inválidos no servidor e aceita as fotos antigas", () => {
    expect(photoFocusSchema.parse({ x: 30, y: 40 })).toEqual({ ...DEFAULT_FRAME, x: 30, y: 40 })
    for (const invalid of [
      { zoom: 0.9 },
      { zoom: 3.1 },
      { zoom: NaN },
      { fit: "stretch" },
      { x: 101 },
      { fit: "contain", zoom: 2 },
    ]) {
      expect(mediaFrameSchema.safeParse({ ...DEFAULT_FRAME, ...invalid }).success).toBe(false)
    }
    expect(readFrame({ fit: "contain", zoom: 2 }).zoom).toBe(1)
  })
})
