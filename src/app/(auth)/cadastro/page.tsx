import Link from "next/link"

import { registerAction } from "@/features/auth/actions"
import { AuthShell } from "@/features/auth/components/auth-shell"
import { RegisterForm } from "@/features/auth/components/auth-form"

export const metadata = { title: "Criar conta" }

export default async function CadastroPage({ searchParams }: PageProps<"/cadastro">) {
  const { next } = await searchParams
  const nextPath = typeof next === "string" ? next : undefined
  const entrarHref = nextPath ? `/entrar?next=${encodeURIComponent(nextPath)}` : "/entrar"

  return (
    <AuthShell
      eyebrow="Área da cliente"
      title="Criar conta"
      description="Seus agendamentos ficam salvos e você remarca sem digitar nada de novo."
      backHref={entrarHref}
      footer={
        <>
          Já tem conta?{" "}
          <Link href={entrarHref} className="font-medium text-pink-300 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <RegisterForm action={registerAction} next={nextPath} />
    </AuthShell>
  )
}
