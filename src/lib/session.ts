import "server-only"
import { redirect } from "next/navigation"

import type { Role } from "@/generated/prisma/enums"
import { auth } from "@/lib/auth"

export type CurrentUser = {
  id: string
  name: string
  email: string | null
  role: Role
}

/* Camada de acesso à sessão: as páginas e actions só falam com estas funções. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? null,
    role: session.user.role,
  }
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") redirect("/admin/entrar")
  return user
}

export async function requireClient(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user || user.role !== "CLIENT") redirect("/entrar")
  return user
}
