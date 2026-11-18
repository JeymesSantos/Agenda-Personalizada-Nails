import { connection } from "next/server"
import { AuthShell } from "@/features/auth/components/auth-shell"
import { accessRequestMessage, accessWhatsappLink } from "@/features/auth/access-messages"
import { getPublicBusinessOrThrow } from "@/features/public/queries"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Recuperar senha" }

export default async function RecuperarSenhaPage() {
  // O banco e os dados do studio só são necessários ao acessar a página.
  await connection()
  const business = await getPublicBusinessOrThrow()
  return (
    <AuthShell
      eyebrow="Área da cliente"
      title="Recuperar senha"
      backHref="/entrar"
      description="Peça ao studio um link para definir uma nova senha. O envio é feito manualmente pelo WhatsApp cadastrado na sua conta."
    >
      {business.whatsapp ? (
        <Button asChild size="lg" className="w-full">
          <a
            href={accessWhatsappLink(business.whatsapp, accessRequestMessage("reset"))}
            target="_blank"
            rel="noreferrer"
          >
            Pedir recuperação pelo WhatsApp
          </a>
        </Button>
      ) : (
        <p className="type-body text-secondary-txt">
          Entre em contato com o studio para solicitar seu link de recuperação.
        </p>
      )}
    </AuthShell>
  )
}
