import { notFound, redirect } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { deleteServiceAction, saveServiceAction } from "@/features/services/actions"
import { ServiceForm } from "@/features/services/components/service-form"
import { getService, listCategories, typicalOpenMinutes } from "@/features/services/queries"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export const metadata = { title: "Editar serviço" }

export default async function EditarServicoPage({ params }: PageProps<"/admin/servicos/[id]">) {
  const { id } = await params
  const user = await requireAdmin()
  const business = await prisma.business.findUniqueOrThrow({ where: { ownerId: user.id } })
  const [service, categories, openMinutes] = await Promise.all([
    getService(business.id, id),
    listCategories(business.id),
    typicalOpenMinutes(business.id, business.timezone),
  ])
  if (!service) notFound()

  const action = saveServiceAction.bind(null, service.id)
  async function onDelete() {
    "use server"
    const result = await deleteServiceAction(id)
    if (!result.error) redirect("/admin/servicos?excluido=1")
    return result
  }

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-5 py-6 lg:px-10 lg:py-8">
      <PageHeader eyebrow="Serviços · Editar" variant="heading" title={service.title} />
      <ServiceForm
        action={action}
        initial={{
          title: service.title,
          description: service.description ?? "",
          categoryId: service.categoryId ?? "",
          durationMin: service.durationMin,
          bufferMin: service.bufferMin,
          priceCents: service.priceCents,
          priceFrom: service.priceFrom,
          visible: service.visible,
          photoUrls: service.photoUrls,
        }}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        typicalOpenMinutes={openMinutes}
        onDelete={onDelete}
      />
    </main>
  )
}
