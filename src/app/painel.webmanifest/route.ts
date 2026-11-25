import manifest from "@/app/manifest"

export const dynamic = "force-dynamic"

/** Metadados públicos da instalação do painel; o acesso continua exigindo sessão ADMIN. */
export async function GET() {
  const publicManifest = await manifest()
  return Response.json(
    {
      ...publicManifest,
      id: "/admin",
      name: `${publicManifest.name} · Painel`,
      short_name: "Painel Agenda",
      description: "Painel da profissional: agenda, serviços e clientes",
      start_url: "/admin",
      scope: "/admin",
      shortcuts: [
        { name: "Agenda", url: "/admin/agenda" },
        { name: "Dashboard", url: "/admin" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-store" } },
  )
}
