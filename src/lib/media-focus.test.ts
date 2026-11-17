import { describe, expect, it } from "vitest"
import { backgroundFraming, DEFAULT_FRAME, dragFrame, photoFraming, readFrame } from "./media-focus"
import { cropWindow, FULL_CROP, moveCrop } from "./media-focus"
import { mediaCropSchema, mediaFrameSchema, photoFocusSchema } from "./media-framing-schema"

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
      { zoom: 0.24 },
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

  it("permite reduzir a imagem e movê-la nos espaços livres", () => {
    for (const fit of ["cover", "contain"] as const) {
      const frame = { ...DEFAULT_FRAME, zoom: 0.5, fit }
      expect(mediaFrameSchema.parse(frame)).toEqual(frame)
      expect(readFrame(frame)).toEqual(frame)
      expect(
        dragFrame(frame, { width: 100, height: 100 }, { width: 100, height: 100 }, 10, -10),
      ).toEqual({ ...frame, x: 70, y: 30 })
    }
  })

  it("recorta dentro dos limites, preserva um tamanho mínimo e move a seleção", () => {
    expect(moveCrop(FULL_CROP, "nw", 20, 30)).toEqual({ x: 20, y: 30, width: 80, height: 70 })
    const crop = { x: 20, y: 30, width: 40, height: 40 }
    expect(moveCrop(crop, "move", 900, -900)).toEqual({ ...crop, x: 60, y: 0 })
    expect(moveCrop(crop, "se", -900, -900)).toEqual({ ...crop, width: 10, height: 10 })
    expect(moveCrop(crop, "se", 900, 900)).toEqual({ ...crop, width: 80, height: 70 })
    expect(mediaCropSchema.safeParse({ ...crop, width: 99 }).success).toBe(false)
    expect(mediaCropSchema.safeParse({ ...crop, height: 0 }).success).toBe(false)
  })

  it("encaixa a área recortada e calcula o arraste pela nova proporção", () => {
    const frame = { ...DEFAULT_FRAME, crop: { x: 25, y: 0, width: 50, height: 100 } }
    expect(cropWindow(frame, { width: 200, height: 100 }, { width: 400, height: 100 })).toEqual({
      width: 100,
      height: 100,
      left: 0,
      top: 0,
    })
    expect(
      dragFrame(frame, { width: 100, height: 100 }, { width: 400, height: 100 }, 20, 30),
    ).toEqual({ ...frame, x: 30 })
    const focus = { a: { ...frame, desktop: { ...DEFAULT_FRAME } } }
    expect(photoFraming(focus, "a").mobile.crop).toEqual(frame.crop)
    expect(photoFraming(focus, "a").desktop.crop).toBeUndefined()
  })
})
