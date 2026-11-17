export const MAX_CLIP_BYTES = 20 * 1024 * 1024
export const MAX_CLIP_SECONDS = 15

export function isPortfolioVideo(url: string) {
  return /\.mp4(?:[?#]|$)/i.test(url)
}

/** Reads the movie duration from an MP4 container, without decoding the clip. */
export function mp4Duration(bytes: Uint8Array): number | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  function boxes(start: number, end: number): number | null {
    let offset = start
    while (offset + 8 <= end) {
      let size = view.getUint32(offset)
      const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8))
      let header = 8
      if (size === 1) {
        if (offset + 16 > end) return null
        size = Number(view.getBigUint64(offset + 8))
        header = 16
      } else if (size === 0) size = end - offset
      if (!Number.isSafeInteger(size) || size < header || offset + size > end) return null
      const data = offset + header
      if (type === "moov") return boxes(data, offset + size)
      if (type === "mvhd") {
        const version = view.getUint8(data)
        if (version > 1) return null
        const scaleAt = data + (version === 1 ? 20 : 12)
        if (scaleAt + (version === 1 ? 12 : 8) > offset + size) return null
        const scale = view.getUint32(scaleAt)
        const duration =
          version === 1 ? Number(view.getBigUint64(scaleAt + 4)) : view.getUint32(scaleAt + 4)
        return scale > 0 && duration > 0 ? duration / scale : null
      }
      offset += size
    }
    return null
  }
  try {
    return boxes(0, bytes.byteLength)
  } catch {
    return null
  }
}

export function validateClip(bytes: Uint8Array): string | null {
  if (bytes.byteLength > MAX_CLIP_BYTES) return "O vídeo precisa ter até 20 MB."
  const duration = mp4Duration(bytes)
  if (duration === null || !Number.isFinite(duration))
    return "Não foi possível ler o vídeo. Envie um MP4 válido."
  if (duration > MAX_CLIP_SECONDS) return "O vídeo precisa ter até 15 segundos."
  return null
}
