/*
 * Regra de item ativo compartilhada por Sidebar e BottomNav.
 * `matchPrefixes` é serializável (pode vir de um Server Component):
 * o item fica ativo quando o caminho é igual ao href ou começa por algum prefixo.
 */
export type NavMatch = {
  href: string
  matchPrefixes?: string[]
}

export function isNavItemActive(item: NavMatch, pathname: string): boolean {
  if (pathname === item.href) return true
  return (item.matchPrefixes ?? []).some((p) => pathname === p || pathname.startsWith(p + "/"))
}
