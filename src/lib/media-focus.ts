export type MediaCrop = { x: number; y: number; width: number; height: number }
export type MediaFrame = {
  x: number
  y: number
  zoom: number
  fit: "cover" | "contain"
  crop?: MediaCrop
}
export type ResponsiveFrames = { mobile: MediaFrame; desktop: MediaFrame }
export type MediaFocus = {
  x: number
  y: number
  zoom?: number
  fit?: MediaFrame["fit"]
  crop?: MediaCrop
  desktop?: MediaFrame
}
export type PhotoFocus = Record<string, MediaFocus>
export const DEFAULT_FRAME: MediaFrame = { x: 50, y: 50, zoom: 1, fit: "cover" }
export const FULL_CROP: MediaCrop = { x: 0, y: 0, width: 100, height: 100 }

export function readCrop(value: unknown): MediaCrop | undefined {
  const v = record(value)
  const { x, y, width, height } = v
  if (
    [x, y, width, height].every((n) => typeof n === "number" && Number.isFinite(n)) &&
    (x as number) >= 0 &&
    (y as number) >= 0 &&
    (width as number) >= 10 &&
    (height as number) >= 10 &&
    (x as number) + (width as number) <= 100 &&
    (y as number) + (height as number) <= 100
  ) {
    return { x, y, width, height } as MediaCrop
  }
}

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
  const crop = value == null ? fallback.crop : readCrop(v.crop)
  return {
    x: percent(v.x, fallback.x),
    y: percent(v.y, fallback.y),
    fit,
    ...(crop ? { crop } : {}),
    zoom:
      typeof v.zoom === "number" && Number.isFinite(v.zoom) && v.zoom >= 0.25 && v.zoom <= 3
        ? Math.min(v.zoom, fit === "contain" ? 1 : 3)
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
  const crop = frame.crop ?? FULL_CROP
  const width = (image.width * crop.width) / 100
  const height = (image.height * crop.height) / 100
  const scale =
    (frame.fit === "cover" ? Math.max : Math.min)(area.width / width, area.height / height) *
    frame.zoom
  const move = (position: number, delta: number, remaining: number) =>
    Math.abs(remaining) < 1
      ? position
      : Math.max(0, Math.min(100, Math.round(position + (delta / remaining) * 100)))
  return {
    ...frame,
    x: move(frame.x, dx, area.width - width * scale),
    y: move(frame.y, dy, area.height - height * scale),
  }
}

export function moveCrop(crop: MediaCrop, handle: string, dx: number, dy: number): MediaCrop {
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
  if (handle === "move")
    return {
      ...crop,
      x: clamp(crop.x + dx, 0, 100 - crop.width),
      y: clamp(crop.y + dy, 0, 100 - crop.height),
    }
  const right = crop.x + crop.width,
    bottom = crop.y + crop.height
  const x = handle.includes("w") ? clamp(crop.x + dx, 0, right - 10) : crop.x
  const y = handle.includes("n") ? clamp(crop.y + dy, 0, bottom - 10) : crop.y
  return {
    x,
    y,
    width: (handle.includes("e") ? clamp(right + dx, x + 10, 100) : right) - x,
    height: (handle.includes("s") ? clamp(bottom + dy, y + 10, 100) : bottom) - y,
  }
}

/** Dimensions of the cropped source fitted into its destination, before zoom. */
export function cropWindow(
  frame: MediaFrame,
  area: { width: number; height: number },
  source: { width: number; height: number },
) {
  const crop = frame.crop ?? FULL_CROP
  const width = (source.width * crop.width) / 100,
    height = (source.height * crop.height) / 100
  if (!width || !height || !area.width || !area.height)
    return { width: 100, height: 100, left: 0, top: 0 }
  const scale = (frame.fit === "cover" ? Math.max : Math.min)(
    area.width / width,
    area.height / height,
  )
  const w = ((width * scale) / area.width) * 100,
    h = ((height * scale) / area.height) * 100
  return {
    width: w,
    height: h,
    left: ((100 - w) * frame.x) / 100,
    top: ((100 - h) * frame.y) / 100,
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
