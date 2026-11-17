export type MediaFocus = { x: number; y: number }
export type PhotoFocus = Record<string, MediaFocus>

export function readPhotoFocus(value: unknown): PhotoFocus {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter(([, point]) => {
      if (!point || typeof point !== "object") return false
      const { x, y } = point as MediaFocus
      return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x <= 100 && y >= 0 && y <= 100
    }),
  )
}

export function photoPosition(value: unknown, url: string | null | undefined): string {
  const focus = url ? readPhotoFocus(value)[url] : undefined
  return `${focus?.x ?? 50}% ${focus?.y ?? 50}%`
}
