import type { Metadata } from "next"

import { PageHeader } from "@/components/layout/page-header"
import { Stepper } from "@/components/ui/stepper"
import { ServiceCatalog } from "@/features/public/components/service-catalog"
import { getPublicBusinessOrThrow, listPublicServices } from "@/features/public/queries"

export const metadata: Metadata = { title: "Escolha o serviço" }

/* Passo 1 de 3 (M3): escolher o serviço. */
export default async function AgendarPage() {
  const b = await getPublicBusinessOrThrow()
  const services = await listPublicServices(b.id)

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-5 pt-8 pb-10 lg:px-10 lg:pt-12">
      <Stepper
        steps={["Serviço", "Data e horário", "Seus dados"]}
        current={0}
        className="hidden lg:flex"
      />
      <PageHeader eyebrow="Passo 1 de 3" title="Escolha o serviço" />
      <ServiceCatalog
        services={services.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          durationMin: s.durationMin,
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
