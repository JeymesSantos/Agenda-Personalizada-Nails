import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { ServiceRow } from "@/features/services/components/service-row"
import { listServices } from "@/features/services/queries"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export const metadata = { title: "Serviços" }

export default async function ServicosPage() {
  const user = await requireAdmin()
  const business = await prisma.business.findUniqueOrThrow({ where: { ownerId: user.id } })
  const services = await listServices(business.id)
  const visible = services.filter((s) => s.visible).length

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-5 py-6 lg:px-10 lg:py-8">
      <PageHeader
        eyebrow={`Serviços · ${visible} visíve${visible === 1 ? "l" : "is"} de ${services.length}`}
        variant="heading"
        title="Serviços"
        actions={
          <Button asChild>
            <Link href="/admin/servicos/novo">
              <PlusIcon /> Novo serviço
            </Link>
          </Button>
        }
      />
      {services.length === 0 ? (
        <EmptyState
          title="Nenhum serviço cadastrado"
          description="Cadastre o primeiro serviço para ele aparecer no catálogo e na agenda da cliente."
          action={
            <Button asChild size="sm">
              <Link href="/admin/servicos/novo">Cadastrar serviço</Link>
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {services.map((s, i) => (
            <ServiceRow
              key={s.id}
              isFirst={i === 0}
              isLast={i === services.length - 1}
              service={{
                id: s.id,
                title: s.title,
                categoryName: s.category?.name ?? null,
                durationMin: s.durationMin,
                bufferMin: s.bufferMin,
                priceCents: s.priceCents,
                priceFrom: s.priceFrom,
                visible: s.visible,
                photoUrl: s.photoUrls[0] ?? null,
                appointmentsCount: s._count.appointments,
              }}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
