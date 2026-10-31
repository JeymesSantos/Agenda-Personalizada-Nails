import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { SummaryList, SummaryRow } from "@/components/ui/summary-list"
import { SignOutButton } from "@/features/auth/components/sign-out-button"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"

export const metadata = { title: "Meus horários" }

/*
 * Placeholder até o commit C6. Duas formas de acesso:
 * - cliente logada (sessão CLIENT)
 * - link com token de gerenciamento (?t=...) para quem agendou sem cadastro
 */
export default async function MeusHorariosPage({ searchParams }: PageProps<"/meus-horarios">) {
  const { t } = await searchParams
  const token = typeof t === "string" ? t : undefined

  if (token) {
    const appointment = await prisma.appointment.findUnique({
      where: { manageToken: token },
      include: { client: true, service: true },
    })
    if (!appointment) notFound()
    const firstName = appointment.client.name.split(" ")[0]
    return (
      <main className="mx-auto w-full max-w-[420px] px-5 py-10">
        <PageHeader eyebrow={`Olá, ${firstName}`} title="Meus horários" />
        <div className="mt-8">
          <SummaryList title={`Comprovante · #${appointment.code}`}>
            <SummaryRow label="Serviço">{appointment.service.title}</SummaryRow>
            <SummaryRow label="Status">{appointment.status}</SummaryRow>
          </SummaryList>
        </div>
      </main>
    )
  }

  const user = await getCurrentUser()
  if (!user || user.role !== "CLIENT") notFound()
  const firstName = user.name.split(" ")[0]

  return (
    <main className="mx-auto w-full max-w-[420px] px-5 py-10">
      <PageHeader
        eyebrow={`Olá, ${firstName}`}
        title="Meus horários"
        description="Você está logada como cliente. A lista de horários chega na Fase C."
        actions={<SignOutButton role="CLIENT" />}
      />
    </main>
  )
}
