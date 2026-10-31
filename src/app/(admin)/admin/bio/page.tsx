import { headers } from "next/headers"

import { PageHeader } from "@/components/layout/page-header"
import { BioForm } from "@/features/bio/components/bio-form"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export const metadata = { title: "Bio & links" }

export default async function BioPage() {
  const user = await requireAdmin()
  const b = await prisma.business.findUniqueOrThrow({ where: { ownerId: user.id } })
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-5 py-6 lg:px-10 lg:py-8">
      <PageHeader
        eyebrow="Bio & links"
        variant="heading"
        title="Editar página pública"
        description="O que a cliente vê ao abrir o link da sua bio. A pré-visualização atualiza enquanto você digita."
      />
      <BioForm
        baseUrl={`${proto}://${host}`}
        initial={{
          name: b.name,
          slug: b.slug,
          tagline: b.tagline ?? "",
          description: b.description ?? "",
          instagram: b.instagram ?? "",
          whatsapp: b.whatsapp ?? "",
          addressLine: b.addressLine ?? "",
          neighborhood: b.neighborhood ?? "",
          hoursSummary: b.hoursSummary ?? "",
          statsAppointments: b.statsAppointments ?? "",
          statsRating: b.statsRating ?? "",
          logoUrl: b.logoUrl ?? "",
          photoUrl: b.photoUrl ?? "",
          cancelMinHours: b.cancelMinHours,
        }}
      />
    </main>
  )
}
