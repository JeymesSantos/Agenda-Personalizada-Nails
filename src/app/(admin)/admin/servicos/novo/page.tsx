import { PageHeader } from "@/components/layout/page-header"
import { saveServiceAction } from "@/features/services/actions"
import { ServiceForm } from "@/features/services/components/service-form"
import { listCategories, typicalOpenMinutes } from "@/features/services/queries"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export const metadata = { title: "Cadastrar serviço" }

export default async function NovoServicoPage() {
  const user = await requireAdmin()
  const business = await prisma.business.findUniqueOrThrow({ where: { ownerId: user.id } })
  const [categories, openMinutes] = await Promise.all([
    listCategories(business.id),
    typicalOpenMinutes(business.id, business.timezone),
  ])
  const action = saveServiceAction.bind(null, null)

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-5 py-6 lg:px-10 lg:py-8">
      <PageHeader eyebrow="Serviços · Novo" variant="heading" title="Cadastrar serviço" />
      <ServiceForm
        action={action}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        typicalOpenMinutes={openMinutes}
      />
    </main>
  )
}
