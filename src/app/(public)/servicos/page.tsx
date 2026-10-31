import type { Metadata } from "next"

import { PageHeader } from "@/components/layout/page-header"
import { ServiceCatalog } from "@/features/public/components/service-catalog"
import { getPublicBusinessOrThrow, listPublicServices } from "@/features/public/queries"

export const metadata: Metadata = { title: "Serviços e valores" }

/* Catálogo público (link "Serviços e valores" da bio e menu desktop). */
export default async function ServicosPublicPage() {
  const b = await getPublicBusinessOrThrow()
  const services = await listPublicServices(b.id)

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-5 pt-8 pb-10 lg:px-10 lg:pt-12">
      <PageHeader
        eyebrow="Catálogo"
        title="Serviços e valores"
        description="Escolha um serviço para ver os horários livres."
      />
      <ServiceCatalog
        services={services.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          durationMin: s.durationMin,
          bufferMin: s.bufferMin,
          priceCents: s.priceCents,
          priceFrom: s.priceFrom,
          photoUrl: s.photoUrls[0] ?? null,
          categoryId: s.categoryId,
          categoryName: s.category?.name ?? null,
        }))}
      />
    </main>
  )
}
