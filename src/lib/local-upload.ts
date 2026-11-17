import "server-only"
import { createReadStream } from "node:fs"
import { realpath, stat } from "node:fs/promises"
import path from "node:path"
import { Readable } from "node:stream"

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
}

/** Runtime fallback for uploads created after next build inventories public/. */
export async function serveLocalUpload(
  request: Request,
  segments: string[],
  root = path.join(process.cwd(), "public", "uploads"),
): Promise<Response> {
  if (
    !segments.length ||
    segments.some((segment) => !/^[\w.-]+$/.test(segment) || segment === "." || segment === "..")
  )
    return new Response(null, { status: 404 })
  const type = contentTypes[path.extname(segments.at(-1)!).toLowerCase()]
  if (!type) return new Response(null, { status: 404 })
  try {
    // Uploaded files exist at runtime; they must not be bundled with server code.
    const directory = await realpath(/* turbopackIgnore: true */ root)
    const file = await realpath(/* turbopackIgnore: true */ path.resolve(directory, ...segments))
    if (!file.startsWith(directory + path.sep)) return new Response(null, { status: 404 })
    const info = await stat(file)
    if (!info.isFile()) return new Response(null, { status: 404 })
    let start = 0,
      end = info.size - 1
    const range = request.headers.get("range")
    const headers = new Headers({
      "Content-Type": type,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Accept-Ranges": "bytes",
    })
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range)
      if (!match || (!match[1] && !match[2]) || info.size === 0)
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${info.size}` },
        })
      if (match[1]) {
        start = Number(match[1])
        end = match[2] ? Math.min(Number(match[2]), end) : end
      } else start = Math.max(0, info.size - Number(match[2]))
      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start > end ||
        start >= info.size
      )
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${info.size}` },
        })
      headers.set("Content-Range", `bytes ${start}-${end}/${info.size}`)
    }
    headers.set("Content-Length", String(Math.max(0, end - start + 1)))
    const body =
      request.method === "HEAD" || info.size === 0
        ? null
        : (Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream<Uint8Array>)
    return new Response(body, { status: range ? 206 : 200, headers })
  } catch (error) {
    if (["ENOENT", "ENOTDIR", "EISDIR"].includes((error as NodeJS.ErrnoException).code ?? ""))
      return new Response(null, { status: 404 })
    throw error
  }
}
