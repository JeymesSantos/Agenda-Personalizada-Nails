import Link from "next/link"

import { loginClientAction } from "@/features/auth/actions"
import { AuthShell } from "@/features/auth/components/auth-shell"
import { LoginForm } from "@/features/auth/components/auth-form"
import { InfoBox } from "@/components/ui/info-box"

export const metadata = { title: "Entrar" }

export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const { next, senha } = await searchParams
  const nextPath = typeof next === "string" ? next : undefined
  const cadastroHref = nextPath ? `/cadastro?next=${encodeURIComponent(nextPath)}` : "/cadastro"

  return (
    <AuthShell
      eyebrow="Área da cliente"
      title="Entrar"
      description="Entre com seu WhatsApp e senha para acessar seus horários e histórico."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href={cadastroHref} className="font-medium text-pink-300 hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      {senha === "alterada" ? (
        <InfoBox>Sua senha foi alterada. Entre com a nova senha.</InfoBox>
      ) : null}
      <LoginForm action={loginClientAction} next={nextPath} />
      <Link
        href="/recuperar-senha"
        className="mt-4 block text-center font-medium text-pink-300 hover:underline"
      >
        Esqueci minha senha
      </Link>
    </AuthShell>
  )
}
