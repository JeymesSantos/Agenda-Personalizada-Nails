import Link from "next/link"

import { loginClientAction } from "@/features/auth/actions"
import { AuthShell } from "@/features/auth/components/auth-shell"
import { LoginForm } from "@/features/auth/components/auth-form"

export const metadata = { title: "Entrar" }

export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const { next } = await searchParams
  const nextPath = typeof next === "string" ? next : undefined
  const cadastroHref = nextPath ? `/cadastro?next=${encodeURIComponent(nextPath)}` : "/cadastro"

  return (
    <AuthShell
      eyebrow="Área da cliente"
      title="Entrar"
      description="Acesse seus horários, remarque com um toque e guarde seu histórico."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href={cadastroHref} className="font-medium text-pink-300 hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm action={loginClientAction} next={nextPath} />
    </AuthShell>
  )
}
