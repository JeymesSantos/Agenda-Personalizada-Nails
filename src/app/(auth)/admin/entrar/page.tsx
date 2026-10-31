import { loginAdminAction } from "@/features/auth/actions"
import { AuthShell } from "@/features/auth/components/auth-shell"
import { LoginForm } from "@/features/auth/components/auth-form"

export const metadata = { title: "Login da profissional" }

export default async function AdminEntrarPage({ searchParams }: PageProps<"/admin/entrar">) {
  const { next } = await searchParams
  const nextPath = typeof next === "string" ? next : undefined

  return (
    <AuthShell
      eyebrow="Painel da profissional"
      title="Login da profissional"
      description="Acesso protegido por e-mail e senha."
      footer="Esqueceu a senha? Fale com o suporte do MinhaAgenda."
    >
      <LoginForm action={loginAdminAction} next={nextPath} submitLabel="Entrar no painel" />
    </AuthShell>
  )
}
