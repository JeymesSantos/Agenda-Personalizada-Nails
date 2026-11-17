import { serveLocalUpload } from "@/lib/local-upload"

export const runtime = "nodejs"

export async function GET(request: Request, context: RouteContext<"/uploads/[...path]">) {
  const params = await context.params
  return serveLocalUpload(request, params.path)
}

export const HEAD = GET
