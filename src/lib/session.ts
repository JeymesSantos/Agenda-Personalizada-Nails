import "server-only"
import { redirect } from "next/navigation"

import type { Role } from "@/generated/prisma/enums"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type CurrentUser = {
  id: string
  name: string
  email: string | null
  role: Role
}

/*
 * Camada de acesso à sessão: as páginas e actions só falam com estas funções.
 * O usuário do token é conferido no banco: se foi apagado (ex.: re-seed),
 * a sessão é tratada como inválida e o `require*` manda para /api/auth/sair,
 * que limpa o cookie e volta para o login.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  })
  if (!user) return null
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

async function hasStaleSession(): Promise<boolean> {
  const session = await auth()
  return Boolean(session?.user?.id)
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (user?.role === "ADMIN") return user
  if (!user && (await hasStaleSession())) redirect("/api/auth/sair?next=/admin/entrar")
  redirect("/admin/entrar")
}

export async function requireClient(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (user?.role === "CLIENT") return user
  if (!user && (await hasStaleSession())) redirect("/api/auth/sair?next=/entrar")
  redirect("/entrar")
}
