import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { InfoBox } from "@/components/ui/info-box"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SignOutButton } from "@/features/auth/components/sign-out-button"
import { MyAppointmentCard } from "@/features/client-area/components/appointment-card"
import { canChange, getMyAppointments, resolveClientAccess } from "@/features/client-area/queries"
import { getPublicBusinessOrThrow } from "@/features/public/queries"

export const metadata: Metadata = { title: "Meus horários" }

/* Meus horários (M7): próximos e anteriores; acesso por conta ou por link com token. */
export default async function MeusHorariosPage({ searchParams }: PageProps<"/meus-horarios">) {
  const sp = await searchParams
  const token = typeof sp.t === "string" ? sp.t : null
  const access = await resolveClientAccess(token)
  if (!access) redirect("/entrar?next=%2Fmeus-horarios")
  const now = new Date()
  const [{ client, upcoming, past }, business] = await Promise.all([
    getMyAppointments(access, now),
    getPublicBusinessOrThrow(),
  ])
  const firstName = client.name.split(" ")[0]
  const tz = business.timezone
  const whatsappUrl = business.whatsapp ? `https://wa.me/55${business.whatsapp}` : null

  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-5 pt-8 pb-10 lg:pt-12">
      {/* no desktop o "Sair" fica no cabeçalho público; aqui só no celular */}
      <PageHeader
        eyebrow={`Olá, ${firstName}`}
        title="Meus horários"
        actions={
          access.kind === "member" ? (
            <div className="lg:hidden">
              <SignOutButton role="CLIENT" />
            </div>
          ) : undefined
        }
      />

      <Tabs defaultValue="proximos">
        <TabsList className="w-full">
          <TabsTrigger value="proximos">Próximos ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="anteriores">Anteriores</TabsTrigger>
        </TabsList>
        <TabsContent value="proximos" className="flex flex-col gap-4">
          {upcoming.length === 0 ? (
            <EmptyState
              title="Nenhum horário agendado"
              description="Quando você agendar, seus próximos horários aparecem aqui."
              action={
                <Button asChild size="sm">
                  <Link href="/agendar">Agendar horário</Link>
                </Button>
              }
            />
          ) : (
            upcoming.map((a) => (
              <MyAppointmentCard
                key={a.id}
                id={a.id}
                code={a.code}
                serviceTitle={a.service.title}
                startsAt={a.startsAt}
                serviceEndsAt={a.serviceEndsAt}
                status={a.status}
                timezone={tz}
                token={token}
                editable
                changeAllowed={canChange(a.startsAt, a.business.cancelMinHours, now)}
              />
            ))
          )}
        </TabsContent>
        <TabsContent value="anteriores" className="flex flex-col gap-4">
          {past.length === 0 ? (
            <EmptyState title="Nenhum atendimento anterior" />
          ) : (
            past.map((a) => (
              <MyAppointmentCard
                key={a.id}
                id={a.id}
                code={a.code}
                serviceTitle={a.service.title}
                startsAt={a.startsAt}
                serviceEndsAt={a.serviceEndsAt}
                status={a.status}
                timezone={tz}
                token={token}
                editable={false}
                changeAllowed={false}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <InfoBox tone="info">
        Alterações gratuitas até {business.cancelMinHours} h antes do horário. Depois disso,{" "}
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="text-pink-300 hover:underline"
          >
            fale com a {business.name.split(" ")[0]} no WhatsApp
          </a>
        ) : (
          `fale com a ${business.name.split(" ")[0]} no WhatsApp`
        )}
        .
      </InfoBox>

      {access.kind === "token" && !client.passwordHash ? (
        <div className="bg-surface border-subtle flex flex-col gap-3 rounded-md border p-4">
          <p className="type-body-medium">Guarde o link deste agendamento</p>
          <p className="type-body text-secondary-txt">
            Este link permite consultar, remarcar ou cancelar somente este agendamento. Para ajuda
            com seu cadastro, fale com o studio.
          </p>
        </div>
      ) : null}
    </main>
  )
}
