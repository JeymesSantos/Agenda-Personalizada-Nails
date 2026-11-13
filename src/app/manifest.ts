import type { MetadataRoute } from "next"

import { prisma } from "@/lib/prisma"

/*
 * Web App Manifest (PWA): instalável na tela inicial com o nome do estúdio,
 * ícone "LF" do brand board e tema escuro. Lê o nome do banco; sem estúdio
 * cadastrado cai no nome genérico.
 */
export const dynamic = "force-dynamic"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const business = await prisma.business
    .findFirst({ select: { name: true, tagline: true } })
    .catch(() => null)
  const name = business?.name ?? "MinhaAgenda"

  return {
    id: "/",
    name,
    short_name: name.length <= 12 ? name : name.split(" ")[0],
    description: business?.tagline ?? "Agenda online para nail designer",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0E0A0C",
    theme_color: "#0E0A0C",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Agendar horário",
        url: "/agendar",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Meus horários",
        url: "/meus-horarios",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  }
}
