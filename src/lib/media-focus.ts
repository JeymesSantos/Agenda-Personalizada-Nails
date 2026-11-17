export type MediaFrame = { x: number; y: number; zoom: number; fit: "cover" | "contain" }
export type ResponsiveFrames = { mobile: MediaFrame; desktop: MediaFrame }
export type MediaFocus = {
  x: number
  y: number
  zoom?: number
  fit?: MediaFrame["fit"]
  desktop?: MediaFrame
}
export type PhotoFocus = Record<string, MediaFocus>
export const DEFAULT_FRAME: MediaFrame = { x: 50, y: 50, zoom: 1, fit: "cover" }

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function readFrame(value: unknown, fallback: MediaFrame = DEFAULT_FRAME): MediaFrame {
  const v = record(value)
  const percent = (n: unknown, otherwise: number) =>
    typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 100 ? n : otherwise
  const fit = v.fit === "cover" || v.fit === "contain" ? v.fit : fallback.fit
  return {
    x: percent(v.x, fallback.x),
    y: percent(v.y, fallback.y),
    fit,
    zoom:
      fit === "contain"
        ? 1
        : typeof v.zoom === "number" && Number.isFinite(v.zoom) && v.zoom >= 1 && v.zoom <= 3
          ? v.zoom
          : fallback.zoom,
  }
}

export function readResponsiveFrames(
  value: unknown,
  mobile = DEFAULT_FRAME,
  desktop = mobile,
): ResponsiveFrames {
  const v = record(value)
  return { mobile: readFrame(v.mobile, mobile), desktop: readFrame(v.desktop, desktop) }
}

export function backgroundFraming(media: {
  focusX: number
  focusY: number
  desktopFocusX: number | null
  desktopFocusY: number | null
  framing?: unknown
}): ResponsiveFrames {
  const mobile = { ...DEFAULT_FRAME, x: media.focusX, y: media.focusY }
  return readResponsiveFrames(media.framing, mobile, {
    ...mobile,
    x: media.desktopFocusX ?? mobile.x,
    y: media.desktopFocusY ?? mobile.y,
  })
}

/** Pixel movement inside the visible frame, using the actual fitted image dimensions. */
export function dragFrame(
  frame: MediaFrame,
  area: { width: number; height: number },
  image: { width: number; height: number },
  dx: number,
  dy: number,
): MediaFrame {
  if (!image.width || !image.height || !area.width || !area.height) return frame
  const scale =
    (frame.fit === "cover" ? Math.max : Math.min)(
      area.width / image.width,
      area.height / image.height,
    ) * frame.zoom
  const move = (position: number, delta: number, remaining: number) =>
    Math.abs(remaining) < 1
      ? position
      : Math.max(0, Math.min(100, Math.round(position + (delta / remaining) * 100)))
  return {
    ...frame,
    x: move(frame.x, dx, area.width - image.width * scale),
    y: move(frame.y, dy, area.height - image.height * scale),
  }
}

export function readPhotoFocus(value: unknown): PhotoFocus {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, point]) => {
        if (!point || typeof point !== "object") return false
        const { x, y } = point as MediaFocus
        return (
          Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x <= 100 && y >= 0 && y <= 100
        )
      })
      .map(([url, point]) => {
        const v = record(point)
        return [
          url,
          {
            ...readFrame(v),
            ...(v.desktop ? { desktop: readFrame(v.desktop, readFrame(v)) } : {}),
          },
        ]
      }),
  )
}

export function photoFraming(value: unknown, url: string | null | undefined): ResponsiveFrames {
  const point = url ? readPhotoFocus(value)[url] : undefined
  const mobile = readFrame(point)
  return { mobile, desktop: readFrame(point?.desktop, mobile) }
}

export function photoPosition(value: unknown, url: string | null | undefined): string {
  const focus = url ? readPhotoFocus(value)[url] : undefined
  return `${focus?.x ?? 50}% ${focus?.y ?? 50}%`
}
