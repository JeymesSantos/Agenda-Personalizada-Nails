import { expect, it } from "vitest"
import { isPortfolioVideo, MAX_CLIP_BYTES, mp4Duration, validateClip } from "./video"

function movie(seconds: number, version = 0) {
  const bytes = Buffer.alloc(80)
  bytes.writeUInt32BE(80, 0)
  bytes.write("moov", 4)
  bytes.writeUInt32BE(72, 8)
  bytes.write("mvhd", 12)
  bytes[16] = version
  const scaleAt = 16 + (version === 1 ? 20 : 12)
  bytes.writeUInt32BE(1000, scaleAt)
  if (version === 1) bytes.writeBigUInt64BE(BigInt(seconds * 1000), scaleAt + 4)
  else bytes.writeUInt32BE(seconds * 1000, scaleAt + 4)
  return bytes
}

it("aceita MP4 de até 15 segundos nas duas versões do cabeçalho", () => {
  for (const version of [0, 1]) {
    expect(mp4Duration(movie(15, version))).toBe(15)
    expect(validateClip(movie(15, version))).toBeNull()
    expect(validateClip(movie(16, version))).toContain("15 segundos")
  }
})

it("rejeita metadados inválidos, arquivos truncados e arquivos grandes", () => {
  expect(validateClip(new Uint8Array(4))).not.toBeNull()
  expect(validateClip(movie(0))).not.toBeNull()
  expect(validateClip(movie(1).subarray(0, 32))).not.toBeNull()
  expect(validateClip(new Uint8Array(MAX_CLIP_BYTES + 1))).toContain("20 MB")
  const corrupt = movie(3)
  corrupt.writeUInt32BE(4, 0)
  expect(mp4Duration(corrupt)).toBeNull()
})

it("identifica vídeos sem tratar fotos como vídeos", () => {
  expect(isPortfolioVideo("/uploads/portfolio/clip.mp4")).toBe(true)
  expect(isPortfolioVideo("https://storage.test/clip.mp4?x=1")).toBe(true)
  expect(isPortfolioVideo("/uploads/foto.webp")).toBe(false)
})
