import { NextResponse, type NextRequest } from "next/server"

import { signOut } from "@/lib/auth"

/* Encerra a sessão (limpa o cookie) e redireciona. Usado quando o token aponta para um usuário que não existe mais. */
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") ?? "/"
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/"
  await signOut({ redirect: false })
  return NextResponse.redirect(new URL(safe, request.url))
}
