import Image from "next/image"
import { notFound } from "next/navigation"

export const metadata = { title: "Tokens de design" }

const colorGroups: { title: string; colors: { name: string; token: string; use: string }[] }[] = [
  {
    title: "Marca",
    colors: [
      { name: "magenta-700", token: "--brand-magenta-700", use: "Pressionado, gradiente" },
      { name: "magenta-500", token: "--brand-magenta-500", use: "Ações primárias, destaques" },
      { name: "magenta-400", token: "--brand-magenta-400", use: "Hover, gráficos" },
      { name: "pink-300", token: "--brand-pink-300", use: "Labels, ícones ativos" },
      { name: "pink-100", token: "--brand-pink-100", use: "Texto sobre magenta" },
    ],
  },
  {
    title: "Superfícies & bordas",
    colors: [
      { name: "base", token: "--bg-base", use: "Fundo da aplicação" },
      { name: "surface", token: "--bg-surface", use: "Cards" },
      { name: "surface-2", token: "--bg-surface-2", use: "Inputs, listas" },
      { name: "elevated", token: "--bg-elevated", use: "Modais, menus" },
      { name: "subtle", token: "--border-subtle", use: "Divisores" },
      { name: "strong", token: "--border-strong", use: "Bordas de input" },
    ],
  },
  {
    title: "Texto & feedback",
    colors: [
      { name: "primary", token: "--text-primary", use: "Títulos e texto" },
      { name: "secondary", token: "--text-secondary", use: "Texto de apoio" },
      { name: "muted", token: "--text-muted", use: "Placeholders" },
      { name: "success", token: "--feedback-success", use: "Confirmado, receita" },
      { name: "warning", token: "--feedback-warning", use: "Pendente" },
      { name: "error", token: "--feedback-error", use: "Cancelado, despesa" },
      { name: "info", token: "--feedback-info", use: "Informativo" },
    ],
  },
]

const typeScale: { name: string; className: string; sample: string; spec: string }[] = [
  {
    name: "Display/XL",
    className: "display-xl",
    sample: "Letícia Fagundes",
    spec: "Montserrat Light 56 · tracking 6%",
  },
  {
    name: "Display/L",
    className: "display-l",
    sample: "Portfólio",
    spec: "Montserrat Light 34 · tracking 4%",
  },
  {
    name: "Display/Label",
    className: "display-label",
    sample: "Passo 1 de 3",
    spec: "Montserrat 12 · caps · tracking 30%",
  },
  {
    name: "Heading/H1",
    className: "type-h1",
    sample: "Agende seu horário",
    spec: "DM Sans Bold 28",
  },
  {
    name: "Heading/H2",
    className: "type-h2",
    sample: "Escolha seu serviço",
    spec: "DM Sans SemiBold 22",
  },
  {
    name: "Heading/H3",
    className: "type-h3",
    sample: "Horários disponíveis",
    spec: "DM Sans SemiBold 17",
  },
  { name: "KPI", className: "type-kpi", sample: "R$ 4.820", spec: "DM Sans Bold 32" },
  {
    name: "Body/L",
    className: "type-body-l",
    sample: "Seu horário foi confirmado. Você receberá um lembrete no WhatsApp.",
    spec: "DM Sans Regular 16",
  },
  {
    name: "Body/M",
    className: "type-body",
    sample: "Duração 1h30 · intervalo 15 min",
    spec: "DM Sans Regular 14",
  },
  {
    name: "Body/M Medium",
    className: "type-body-medium",
    sample: "Alongamento em gel",
    spec: "DM Sans Medium 14",
  },
  {
    name: "Caption",
    className: "type-caption",
    sample: "Hoje · 14:30",
    spec: "DM Sans Medium 11 · caps",
  },
  {
    name: "Button",
    className: "type-button",
    sample: "Confirmar agendamento",
    spec: "DM Sans SemiBold 15",
  },
]

const radii = [
  { name: "xs", value: "5px", use: "Barras, tags" },
  { name: "sm", value: "12px", use: "Itens de lista, slots" },
  { name: "md", value: "14px", use: "Cards, inputs" },
  { name: "lg", value: "24px", use: "Sheets, hero" },
  { name: "full", value: "999px", use: "Botões, chips, badges" },
]

export default function TokensPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 pb-24">
      <header className="bg-gradient-hero -mx-4 mb-10 px-4 pt-10 pb-8">
        <p className="display-label text-pink-300">Identidade visual · Agenda online</p>
        <h1 className="display-xl mt-3">Letícia Fagundes</h1>
        <p className="type-body-l text-secondary mt-3 max-w-xl">
          Página de referência dos tokens aplicados. Compare com o brand board do Figma.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="type-h2 mb-5">01 · Marca</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <figure className="bg-surface border-subtle rounded-md border p-6">
            <Image
              src="/brand/logo-magenta.svg"
              alt="Logo principal"
              width={160}
              height={160}
              className="mx-auto"
            />
            <figcaption className="type-caption text-muted mt-4 text-center">
              Principal · fundos escuros
            </figcaption>
          </figure>
          <figure className="bg-gradient-primary rounded-md p-6">
            <Image
              src="/brand/logo-branca.svg"
              alt="Logo negativa"
              width={160}
              height={160}
              className="mx-auto"
            />
            <figcaption className="type-caption mt-4 text-center text-pink-100">
              Negativa · fundo magenta
            </figcaption>
          </figure>
          <figure className="bg-surface border-subtle rounded-md border p-6">
            <Image
              src="/brand/app-icon.svg"
              alt="Ícone do app"
              width={120}
              height={120}
              className="mx-auto"
            />
            <figcaption className="type-caption text-muted mt-4 text-center">
              Ícone PWA · avatar
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="type-h2 mb-5">02 · Cor</h2>
        <div className="space-y-8">
          {colorGroups.map((group) => (
            <div key={group.title}>
              <h3 className="type-caption text-secondary mb-3">{group.title}</h3>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.colors.map((c) => (
                  <li
                    key={c.token}
                    className="bg-surface border-subtle overflow-hidden rounded-md border"
                  >
                    <div className="h-16" style={{ background: `var(${c.token})` }} />
                    <div className="p-3">
                      <p className="type-body-medium">{c.name}</p>
                      <p className="type-caption text-muted mt-1 tracking-normal normal-case">
                        {c.use}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-gradient-primary glow-primary type-button flex h-14 items-center justify-center rounded-full text-pink-100">
            Gradiente primário + glow
          </div>
          <div className="bg-gradient-photo type-caption flex h-14 items-center justify-center rounded-md text-pink-100">
            Gradiente de foto
          </div>
          <div className="bg-gradient-hero bg-surface type-caption text-secondary flex h-14 items-center justify-center rounded-md">
            Gradiente de hero
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="type-h2 mb-5">03 · Tipo</h2>
        <ul className="divide-subtle divide-y">
          {typeScale.map((t) => (
            <li key={t.name} className="grid grid-cols-1 gap-2 py-5 sm:grid-cols-[180px_1fr]">
              <div>
                <p className="type-body-medium">{t.name}</p>
                <p className="type-caption text-muted mt-1 tracking-normal normal-case">{t.spec}</p>
              </div>
              <p className={t.className}>{t.sample}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="type-h2 mb-5">04 · Raios</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {radii.map((r) => (
            <li key={r.name} className="text-center">
              <div
                className="bg-surface-2 border-strong mx-auto h-20 w-full border"
                style={{ borderRadius: r.value }}
              />
              <p className="type-body-medium mt-2">
                {r.name} · {r.value}
              </p>
              <p className="type-caption text-muted mt-1 tracking-normal normal-case">{r.use}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
