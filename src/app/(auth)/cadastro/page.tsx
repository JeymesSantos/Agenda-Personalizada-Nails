import Link from "next/link"

import { registerAction } from "@/features/auth/actions"
import { AuthShell } from "@/features/auth/components/auth-shell"
import { RegisterForm } from "@/features/auth/components/auth-form"

export const metadata = { title: "Criar conta" }

export default async function CadastroPage({ searchParams }: PageProps<"/cadastro">) {
  const { next, convite } = await searchParams
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
      <RegisterForm
        action={registerAction}
        next={nextPath}
        invitation={typeof convite === "string" ? convite : undefined}
      />
      {!convite ? (
        <div className="mt-5 flex flex-col gap-2">
          <p className="type-body text-secondary-txt">
            Já agendou sem cadastro? Use o mesmo WhatsApp do agendamento para criar sua conta e
            manter seus horários e histórico. Não precisa de convite.
          </p>
        </div>
      ) : null}
    </AuthShell>
  )
}
