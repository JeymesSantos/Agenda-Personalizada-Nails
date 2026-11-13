import type { BackgroundPage, BackgroundVeil } from "@/generated/prisma/enums"

/*
 * Telas que podem ter mídia de fundo própria. Só dados serializáveis: o mapa é
 * usado no servidor (queries, painel) e no cliente (resolver a tela pela rota).
 * `prefixes` casa por prefixo de rota; `exact` só pela rota inteira.
 */
export type BackgroundArea = "PUBLIC" | "ADMIN"

export type BackgroundPageDef = {
  key: BackgroundPage
  area: BackgroundArea
  label: string
  /* padrão da área: as demais telas herdam dele quando não têm mídia própria */
  isDefault?: boolean
  exact?: string[]
  prefixes?: string[]
}

export const BACKGROUND_PAGES: BackgroundPageDef[] = [
  { key: "PUBLIC_DEFAULT", area: "PUBLIC", label: "Padrão da área da cliente", isDefault: true },
  { key: "PUBLIC_HOME", area: "PUBLIC", label: "Início", exact: ["/"] },
  { key: "PUBLIC_SERVICES", area: "PUBLIC", label: "Serviços", prefixes: ["/servicos"] },
  { key: "PUBLIC_PORTFOLIO", area: "PUBLIC", label: "Portfólio", prefixes: ["/portfolio"] },
  { key: "PUBLIC_BOOKING", area: "PUBLIC", label: "Agendar", prefixes: ["/agendar"] },
  {
    key: "PUBLIC_MY_APPOINTMENTS",
    area: "PUBLIC",
    label: "Meus horários",
    prefixes: ["/meus-horarios"],
  },
  {
    key: "PUBLIC_CONFIRMATION",
    area: "PUBLIC",
    label: "Confirmação do agendamento",
    prefixes: ["/agendamento"],
  },
  {
    key: "PUBLIC_LOGIN",
    area: "PUBLIC",
    label: "Login e cadastro",
    prefixes: ["/entrar", "/cadastro", "/admin/entrar"],
  },
  { key: "ADMIN_DEFAULT", area: "ADMIN", label: "Padrão do painel", isDefault: true },
  { key: "ADMIN_DASHBOARD", area: "ADMIN", label: "Dashboard", exact: ["/admin"] },
  { key: "ADMIN_AGENDA", area: "ADMIN", label: "Agenda", prefixes: ["/admin/agenda"] },
  { key: "ADMIN_SERVICES", area: "ADMIN", label: "Serviços", prefixes: ["/admin/servicos"] },
  { key: "ADMIN_PORTFOLIO", area: "ADMIN", label: "Portfólio", prefixes: ["/admin/portfolio"] },
  { key: "ADMIN_EXPENSES", area: "ADMIN", label: "Despesas", prefixes: ["/admin/despesas"] },
  { key: "ADMIN_CLIENTS", area: "ADMIN", label: "Clientes", prefixes: ["/admin/clientes"] },
  { key: "ADMIN_BIO", area: "ADMIN", label: "Bio & links", prefixes: ["/admin/bio"] },
  {
    key: "ADMIN_AVAILABILITY",
    area: "ADMIN",
    label: "Disponibilidade",
    prefixes: ["/admin/disponibilidade"],
  },
  { key: "ADMIN_MORE", area: "ADMIN", label: "Mais (celular)", prefixes: ["/admin/mais"] },
]

export function defaultPageFor(area: BackgroundArea): BackgroundPage {
  return area === "ADMIN" ? "ADMIN_DEFAULT" : "PUBLIC_DEFAULT"
}

export function pagesOfArea(area: BackgroundArea): BackgroundPageDef[] {
  return BACKGROUND_PAGES.filter((p) => p.area === area)
}

/* Tela correspondente à rota; cai no padrão da área quando nenhuma casa. */
export function resolveBackgroundPage(pathname: string, area: BackgroundArea): BackgroundPage {
  const path = pathname.replace(/\/+$/, "") || "/"
  for (const page of BACKGROUND_PAGES) {
    if (page.area !== area) continue
    if (page.exact?.includes(path)) return page.key
    if (page.prefixes?.some((p) => path === p || path.startsWith(`${p}/`))) return page.key
  }
  return defaultPageFor(area)
}

export const VEIL_LABELS: Record<BackgroundVeil, string> = {
  LIGHT: "Leve",
  MEDIUM: "Médio",
  DENSE: "Denso",
}

export const PAGE_LABELS: Record<BackgroundPage, string> = Object.fromEntries(
  BACKGROUND_PAGES.map((p) => [p.key, p.label]),
) as Record<BackgroundPage, string>
