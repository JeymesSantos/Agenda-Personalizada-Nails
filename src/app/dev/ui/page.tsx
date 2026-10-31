import { Suspense } from "react"
import { notFound } from "next/navigation"
import {
  BarChart3Icon,
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  HomeIcon,
  ImageIcon,
  AtSignIcon,
  MenuIcon,
  MessageCircleIcon,
  ReceiptIcon,
  SearchIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"

import { BottomNav } from "@/components/layout/bottom-nav"
import { PageHeader } from "@/components/layout/page-header"
import { PublicHeader } from "@/components/layout/public-header"
import { Sidebar } from "@/components/layout/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chip, ChipGroup } from "@/components/ui/chip"
import { EmptyState } from "@/components/ui/empty-state"
import { InfoBox } from "@/components/ui/info-box"
import { Input } from "@/components/ui/input"
import { KpiCard } from "@/components/ui/kpi-card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { SlotButton } from "@/components/ui/slot-button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Stepper } from "@/components/ui/stepper"
import { SummaryList, SummaryRow } from "@/components/ui/summary-list"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { OverlaysDemo } from "./overlays-demo"

export const metadata = { title: "Kit de componentes" }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="type-h2 border-subtle border-b pb-3">{title}</h2>
      {children}
    </section>
  )
}

const clientNav = [
  { href: "/", label: "Início", icon: <HomeIcon /> },
  { href: "/portfolio", label: "Portfólio", icon: <ImageIcon /> },
  { href: "/agendar", label: "Agendar", icon: <CalendarIcon /> },
  { href: "/meus-horarios", label: "Meus horários", icon: <ClockIcon /> },
]

const adminNav = [
  { href: "/admin", label: "Início", icon: <BarChart3Icon /> },
  { href: "/admin/agenda", label: "Agenda", icon: <CalendarIcon /> },
  { href: "/admin/servicos", label: "Serviços", icon: <SparklesIcon /> },
  { href: "/admin/despesas", label: "Financeiro", icon: <WalletIcon /> },
  { href: "/admin/mais", label: "Mais", icon: <MenuIcon /> },
]

const sidebarItems = [
  { href: "/admin", label: "Dashboard", icon: <BarChart3Icon /> },
  { href: "/admin/agenda", label: "Agenda", icon: <CalendarIcon /> },
  { href: "/admin/servicos", label: "Serviços", icon: <SparklesIcon /> },
  { href: "/admin/portfolio", label: "Portfólio", icon: <ImageIcon /> },
  { href: "/admin/despesas", label: "Despesas", icon: <ReceiptIcon /> },
  { href: "/admin/clientes", label: "Clientes", icon: <UsersIcon /> },
  { href: "/admin/bio", label: "Bio & links", icon: <AtSignIcon /> },
]

export default function UiKitPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-14 px-4 py-10 pb-32">
      <PageHeader
        eyebrow="04 · UI Kit"
        title="Componentes"
        description="Kit base ajustado aos tokens do Figma. Compare com o brand board e as telas."
      />

      <Section title="Botões">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Agendar horário</Button>
          <Button variant="secondary">Ver portfólio</Button>
          <Button variant="soft">Remarcar</Button>
          <Button variant="ghost">Ver agenda</Button>
          <Button variant="danger">Cancelar</Button>
          <Button variant="link">Ver tudo</Button>
          <Button size="icon" variant="soft" aria-label="Pesquisar">
            <SearchIcon />
          </Button>
          <Button disabled>Indisponível</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">Confirmar agendamento</Button>
          <Button size="sm" variant="secondary">
            Trocar
          </Button>
          <Button size="xs" variant="soft">
            <CalendarIcon /> Quero esse
          </Button>
        </div>
      </Section>

      <Section title="Chips e segmented control">
        <ChipGroup>
          <Chip active>Todos</Chip>
          <Chip>Alongamento</Chip>
          <Chip>Manutenção</Chip>
          <Chip>Nail art</Chip>
          <Chip>Blindagem</Chip>
        </ChipGroup>
        <div className="flex flex-wrap gap-4">
          <Tabs defaultValue="proximos">
            <TabsList>
              <TabsTrigger value="proximos">Próximos (2)</TabsTrigger>
              <TabsTrigger value="anteriores">Anteriores</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs defaultValue="mes">
            <TabsList>
              <TabsTrigger value="dia">Dia</TabsTrigger>
              <TabsTrigger value="semana">Semana</TabsTrigger>
              <TabsTrigger value="mes">Mês</TabsTrigger>
              <TabsTrigger value="ano">Ano</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs defaultValue="inicio">
            <TabsList variant="line">
              <TabsTrigger value="inicio">Início</TabsTrigger>
              <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
              <TabsTrigger value="servicos">Serviços</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Section>

      <Section title="Campos de formulário">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" placeholder="Como podemos te chamar?" startIcon={<UserIcon />} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="whats">WhatsApp</Label>
            <Input id="whats" placeholder="(11) 9 9999-9999" startIcon={<MessageCircleIcon />} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="busca">Buscar</Label>
            <Input
              id="busca"
              placeholder="Alongamento, manutenção, nail art…"
              startIcon={<SearchIcon />}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="erro">Com erro</Label>
            <Input id="erro" defaultValue="(11) 9" aria-invalid />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="obs">Observações (opcional)</Label>
            <Textarea id="obs" placeholder="Formato, cor, alergias…" />
          </div>
          <label className="bg-surface border-subtle flex items-center justify-between gap-4 rounded-md border p-4 sm:col-span-2">
            <span className="flex flex-col">
              <span className="type-body-medium">Salvar meus dados para remarcar com 1 toque</span>
              <span className="type-body text-secondary-txt">Guardamos nome e WhatsApp</span>
            </span>
            <Switch defaultChecked />
          </label>
        </div>
      </Section>

      <Section title="Badges de status">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status="CONFIRMED" />
          <StatusBadge status="PENDING" />
          <StatusBadge status="DONE" />
          <StatusBadge status="CANCELLED" />
          <StatusBadge status="NO_SHOW" />
          <Badge variant="info">Fixa</Badge>
          <Badge variant="magenta">Variável</Badge>
          <Badge variant="dark">Capa</Badge>
          <Badge variant="outline">Destaque na bio</Badge>
        </div>
      </Section>

      <Section title="Cards e listas">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Alongamento em gel</CardTitle>
              <CardDescription>
                Molde F1 com acabamento natural. Inclui cutilagem e esmaltação em gel.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="type-body text-secondary-txt flex items-center gap-2">
                <ClockIcon className="size-4" /> 2h00 · +15 min
              </span>
              <span className="type-h2 text-pink-300">R$ 180</span>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex items-start gap-4">
              <div className="bg-surface-2 border-magenta-500/40 flex size-14 shrink-0 flex-col items-center justify-center rounded-sm border">
                <span className="type-caption text-pink-300">Nov</span>
                <span className="type-h2">05</span>
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <p className="type-h3">Alongamento em gel</p>
                <p className="type-body text-secondary-txt">Quinta · 14:15 – 16:15</p>
                <StatusBadge status="CONFIRMED" />
              </div>
            </CardContent>
          </Card>
          <SummaryList title="Resumo">
            <SummaryRow icon={<SparklesIcon />} label="Serviço">
              Alongamento em gel
            </SummaryRow>
            <SummaryRow icon={<CalendarIcon />} label="Data">
              Qui, 5 de novembro
            </SummaryRow>
            <SummaryRow icon={<ClockIcon />} label="Horário">
              14:15 – 16:15
            </SummaryRow>
            <SummaryRow icon={<CreditCardIcon />} label="Valor" highlight>
              R$ 180
            </SummaryRow>
          </SummaryList>
        </div>
      </Section>

      <Section title="KPIs">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            icon={<WalletIcon />}
            label="Faturamento"
            value="R$ 8.420"
            delta="+12% vs. mês anterior"
          />
          <KpiCard icon={<UsersIcon />} label="Atendimentos" value="64" delta="+8 atendimentos" />
          <KpiCard icon={<BarChart3Icon />} label="Ticket médio" value="R$ 131" delta="+4%" />
          <KpiCard
            icon={<ReceiptIcon />}
            label="Lucro líquido"
            value="R$ 6.150"
            hint="Despesas: R$ 2.270"
          />
        </div>
      </Section>

      <Section title="Horários e calendário">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <p className="type-caption text-secondary-txt">Manhã</p>
            <div className="flex flex-wrap gap-3">
              <SlotButton unavailable>09:00</SlotButton>
              <SlotButton>10:15</SlotButton>
            </div>
            <p className="type-caption text-secondary-txt">Tarde</p>
            <div className="flex flex-wrap gap-3">
              <SlotButton>13:45</SlotButton>
              <SlotButton selected>14:15</SlotButton>
              <SlotButton unavailable>15:00</SlotButton>
              <SlotButton>16:30</SlotButton>
              <SlotButton unavailable>17:00</SlotButton>
            </div>
            <InfoBox tone="info">
              Horários calculados para 2h de serviço + 15 min de reorganização. Atualizados em tempo
              real.
            </InfoBox>
            <InfoBox tone="success">Lucro de outubro: R$ 6.150 (73% do faturamento).</InfoBox>
            <InfoBox tone="magenta">
              Cada atendimento bloqueia 2h15 na agenda. No seu horário atual cabem até 3
              atendimentos por dia.
            </InfoBox>
          </div>
          <Card>
            <CardContent>
              <Suspense fallback={<Skeleton className="mx-auto h-72 w-full" />}>
                <Calendar mode="single" className="mx-auto" />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Stepper, avatar, skeleton e vazio">
        <Stepper steps={["Serviço", "Data e horário", "Seus dados"]} current={1} />
        <div className="flex items-center gap-4">
          <Avatar className="size-12">
            <AvatarFallback className="bg-surface-2 type-body-medium text-pink-300">
              MS
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <EmptyState
          title="Nenhum horário agendado"
          description="Quando você agendar, seus próximos horários aparecem aqui."
          action={<Button size="sm">Agendar horário</Button>}
        />
      </Section>

      <Section title="Overlays e toasts">
        <OverlaysDemo />
      </Section>

      <Section title="Navegação">
        <div className="border-subtle relative h-[88px] overflow-hidden rounded-md border">
          <BottomNav items={clientNav} activeHref="/" className="static w-full lg:flex" />
        </div>
        <div className="border-subtle relative h-[88px] overflow-hidden rounded-md border">
          <BottomNav items={adminNav} activeHref="/admin" className="static w-full lg:flex" />
        </div>
        <div className="border-subtle hidden overflow-hidden rounded-md border lg:block">
          <PublicHeader
            items={[
              { href: "/", label: "Início" },
              { href: "/portfolio", label: "Portfólio" },
              { href: "/servicos", label: "Serviços" },
              { href: "/meus-horarios", label: "Meus horários" },
            ]}
            businessName="Letícia Fagundes"
            activeHref="/"
          />
        </div>
        <div className="border-subtle hidden h-[720px] overflow-hidden rounded-md border lg:flex">
          <Sidebar items={sidebarItems} businessName="Letícia Fagundes" activeHref="/admin" />
          <div className="type-body text-secondary-txt flex flex-1 items-center justify-center">
            Conteúdo do painel
          </div>
        </div>
      </Section>
    </main>
  )
}
