import {
  AtSignIcon,
  BarChart3Icon,
  CalendarIcon,
  ImageIcon,
  ImagesIcon,
  MenuIcon,
  ReceiptIcon,
  SparklesIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"

import type { BottomNavItem } from "@/components/layout/bottom-nav"
import type { SidebarItem } from "@/components/layout/sidebar"

/* Sidebar (desktop), na ordem do Figma. Só dados serializáveis: vão de Server para Client Component. */
export const adminSidebarItems: SidebarItem[] = [
  { href: "/admin", label: "Dashboard", icon: <BarChart3Icon /> },
  {
    href: "/admin/agenda",
    label: "Agenda",
    icon: <CalendarIcon />,
    matchPrefixes: ["/admin/agenda", "/admin/disponibilidade"],
  },
  {
    href: "/admin/servicos",
    label: "Serviços",
    icon: <SparklesIcon />,
    matchPrefixes: ["/admin/servicos"],
  },
  {
    href: "/admin/portfolio",
    label: "Portfólio",
    icon: <ImageIcon />,
    matchPrefixes: ["/admin/portfolio"],
  },
  {
    href: "/admin/despesas",
    label: "Despesas",
    icon: <ReceiptIcon />,
    matchPrefixes: ["/admin/despesas"],
  },
  {
    href: "/admin/clientes",
    label: "Clientes",
    icon: <UsersIcon />,
    matchPrefixes: ["/admin/clientes"],
  },
  { href: "/admin/bio", label: "Bio & links", icon: <AtSignIcon />, matchPrefixes: ["/admin/bio"] },
  {
    href: "/admin/fundos",
    label: "Fundos",
    icon: <ImagesIcon />,
    matchPrefixes: ["/admin/fundos"],
  },
]

/* Barra inferior (mobile), 5 itens como na tela AM1. */
export const adminBottomNavItems: BottomNavItem[] = [
  { href: "/admin", label: "Início", icon: <BarChart3Icon /> },
  {
    href: "/admin/agenda",
    label: "Agenda",
    icon: <CalendarIcon />,
    matchPrefixes: ["/admin/agenda", "/admin/disponibilidade"],
  },
  {
    href: "/admin/servicos",
    label: "Serviços",
    icon: <SparklesIcon />,
    matchPrefixes: ["/admin/servicos"],
  },
  {
    href: "/admin/despesas",
    label: "Financeiro",
    icon: <WalletIcon />,
    matchPrefixes: ["/admin/despesas"],
  },
  {
    href: "/admin/mais",
    label: "Mais",
    icon: <MenuIcon />,
    matchPrefixes: [
      "/admin/mais",
      "/admin/portfolio",
      "/admin/clientes",
      "/admin/bio",
      "/admin/fundos",
    ],
  },
]
