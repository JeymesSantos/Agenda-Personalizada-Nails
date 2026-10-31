import { PageHeader } from "@/components/layout/page-header"
import { SignOutButton } from "@/features/auth/components/sign-out-button"
import { requireAdmin } from "@/lib/session"

export const metadata = { title: "Painel" }

/* Placeholder até o commit B2 (dashboard). Serve para validar o fluxo de login. */
export default async function AdminHomePage() {
  const user = await requireAdmin()
  const firstName = user.name.split(" ")[0]

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      <PageHeader
        eyebrow="Painel da profissional"
        variant="heading"
        title={`Olá, ${firstName}`}
        description="Você está logada como profissional. O dashboard chega na próxima fase."
        actions={<SignOutButton role="ADMIN" />}
      />
    </main>
  )
}
