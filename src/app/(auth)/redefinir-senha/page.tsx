import Link from "next/link"
import { AuthShell } from "@/features/auth/components/auth-shell"
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form"
import { passwordResetClientId, validPasswordReset } from "@/features/auth/password-reset"
import { prisma } from "@/lib/prisma"

export const metadata = {
  title: "Definir nova senha",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

export default async function RedefinirSenhaPage({ searchParams }: PageProps<"/redefinir-senha">) {
  const params = await searchParams
  const token = typeof params.token === "string" ? params.token : ""
  const id = passwordResetClientId(token)
  const client = id ? await prisma.user.findFirst({ where: { id, role: "CLIENT" } }) : null
  const valid =
    client?.passwordHash &&
    validPasswordReset(token, { ...client, passwordHash: client.passwordHash })
  return (
    <AuthShell eyebrow="Área da cliente" title="Definir nova senha" backHref="/entrar">
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="type-body">Link inválido, expirado ou já utilizado.</p>
          <Link href="/recuperar-senha" className="font-medium text-pink-300 hover:underline">
            Pedir um novo link ao studio
          </Link>
        </div>
      )}
    </AuthShell>
  )
}
