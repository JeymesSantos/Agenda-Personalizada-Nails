import NextAuth from "next-auth"
import { NextResponse, type NextRequest } from "next/server"

import { authConfig } from "@/lib/auth.config"

/*
 * Verificação otimista de acesso (a autorização de verdade acontece nas páginas
 * e actions via lib/session.ts):
 * - /admin/**        → exige sessão ADMIN; senão manda para /admin/entrar
 * - /meus-horarios/** → exige sessão CLIENT, exceto quando há ?t=<token de gerenciamento>
 *   (cliente sem cadastro acessa pelo link do WhatsApp); a página valida o token.
 * - /entrar, /cadastro, /admin/entrar → quem já está logado vai para a própria área.
 */
const { auth } = NextAuth(authConfig)

export default auth((request: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname, searchParams } = request.nextUrl
  const role = request.auth?.user?.role

  const isAdminLogin = pathname === "/admin/entrar"
  const isAdminArea = pathname.startsWith("/admin") && !isAdminLogin
  const isClientArea = pathname.startsWith("/meus-horarios")
  const isClientAuthPage = pathname === "/entrar" || pathname === "/cadastro"

  if (isAdminArea && role !== "ADMIN") {
    const url = new URL("/admin/entrar", request.url)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  if (isClientArea && role !== "CLIENT" && !searchParams.get("t")) {
    const url = new URL("/entrar", request.url)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  if (isAdminLogin && role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  if (isClientAuthPage && role === "CLIENT") {
    return NextResponse.redirect(new URL("/meus-horarios", request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*", "/meus-horarios/:path*", "/entrar", "/cadastro"],
}
