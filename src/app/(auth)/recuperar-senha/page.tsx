import { connection } from "next/server"
import Link from "next/link"
import { AuthShell } from "@/features/auth/components/auth-shell"
import { accessRequestMessage, accessWhatsappLink } from "@/features/auth/access-messages"
import { getPublicBusinessOrThrow } from "@/features/public/queries"
import { Button } from "@/components/ui/button"
import { whatsappSchema } from "@/features/auth/schemas"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Recuperar senha" }

export default async function RecuperarSenhaPage() {
  // O banco e os dados do studio só são necessários ao acessar a página.
  await connection()
  const business = await getPublicBusinessOrThrow()
  let contact = whatsappSchema.safeParse(business.whatsapp)
  if (!contact.success) {
    const admin = await prisma.user.findFirst({
      where: { id: business.ownerId, role: "ADMIN" },
      select: { whatsapp: true },
    })
    contact = whatsappSchema.safeParse(admin?.whatsapp)
  }
  return (
    <AuthShell
      eyebrow="Área da cliente"
      title="Recuperar senha"
      backHref="/entrar"
      description="Peça ao studio um link para definir uma nova senha. O envio será feito em alguns minutos no seu WhatsApp."
    >
      {contact.success ? (
        <Button asChild size="lg" className="w-full">
          <a
            href={accessWhatsappLink(contact.data, accessRequestMessage("reset"))}
            target="_blank"
            rel="noreferrer"
          >
            Recuperar senha
          </a>
        </Button>
      ) : (
        <div className="flex flex-col gap-3">
          <Button size="lg" className="w-full" disabled>
            Recuperar senha
          </Button>
          <p className="type-body text-secondary-txt">
            O WhatsApp do studio ainda não está disponível.
          </p>
        </div>
      )}
      <section aria-labelledby="guest-booking-title" className="mt-8 flex flex-col gap-3">
        <h2 id="guest-booking-title" className="type-body-medium">
          Pode agendar sem entrar
        </h2>
        <p className="type-body text-secondary-txt">
          Use o mesmo WhatsApp cadastrado na sua conta para manter o novo agendamento vinculado a
          ela. Após recuperar o acesso, você poderá consultar seu histórico completo.
        </p>
        <Button asChild variant="secondary" size="lg" className="w-full">
          <Link href="/servicos">Agendar sem entrar</Link>
        </Button>
      </section>
    </AuthShell>
  )
}
