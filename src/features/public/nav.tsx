import { CalendarIcon, ClockIcon, HomeIcon, ImageIcon } from "lucide-react"

import type { BottomNavItem } from "@/components/layout/bottom-nav"
import type { PublicNavItem } from "@/components/layout/public-header"

/* Barra inferior da cliente (M1–M8): Início, Portfólio, Agendar, Meus horários. */
export const clientBottomNavItems: BottomNavItem[] = [
  { href: "/", label: "Início", icon: <HomeIcon /> },
  { href: "/portfolio", label: "Portfólio", icon: <ImageIcon />, matchPrefixes: ["/portfolio"] },
  {
    href: "/agendar",
    label: "Agendar",
    icon: <CalendarIcon />,
    matchPrefixes: ["/agendar", "/servicos"],
  },
  {
    href: "/meus-horarios",
    label: "Meus horários",
    icon: <ClockIcon />,
    matchPrefixes: ["/meus-horarios"],
  },
]

/* Menu do cabeçalho desktop (D1/D2). */
export const clientHeaderItems: PublicNavItem[] = [
  { href: "/", label: "Início" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/servicos", label: "Serviços" },
  { href: "/meus-horarios", label: "Meus horários" },
]
