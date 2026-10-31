# Plano de criação do web app MinhaAgenda

Plano de execução para construir o web app a partir do design no Figma
([arquivo](https://www.figma.com/design/iTZZOI3KZwIkgRNLdkFLlh/MinhaAgenda-%E2%80%94-Fluxo-de-P%C3%A1ginas---Identidade-Visual--c%C3%B3pia-)).
Baseado na leitura completa do arquivo: brand board, fluxo de páginas e 20 telas.
Cada etapa termina em **um commit** que compila, passa no lint e nos testes existentes.
O plano é executado pelo Claude Code; o usuário valida ao final de cada fase.

Tokens de cor, tipografia e componentes estão em [design-tokens.md](design-tokens.md).

## 1. Produto

Agenda online para a nail designer **Letícia Fagundes** (Studio LF). Duas jornadas,
ligadas por um motor de horários:

- **Cliente (mobile-first, responsivo):** entra pelo link na bio do Instagram, vê a
  página da Letícia, o portfólio e o catálogo, escolhe serviço → data e horário →
  seus dados (com ou sem cadastro) → confirmação. Depois acompanha, remarca ou cancela
  em "Meus horários". Recebe confirmação e lembrete no WhatsApp.
- **Profissional (admin, desktop + mobile):** dashboard com KPIs, agenda (dia/semana/mês)
  com detalhe e ações, serviços, disponibilidade com bloqueios/liberações, portfólio,
  despesas com relatório financeiro, clientes, bio & links.

**Regra de negócio central** (frame "Como os horários livres são calculados"): cada serviço
ocupa `duração + tempo de reorganização`; o próximo horário só abre depois disso. Bloqueios
(almoço, folga, mês fechado) e agendamentos existentes são removidos antes de mostrar os
horários para a cliente. Tudo em tempo real.

**Fora do escopo da v1:** pagamento online (design diz "pagamento no local"), múltiplas
profissionais por estúdio, app nativo (PWA cobre).

## 2. Telas do Figma → rotas

| Figma                                          | Rota                                                | Fase |
| ---------------------------------------------- | --------------------------------------------------- | ---- |
| M1 Bio / Início · D1 Início desktop            | `/`                                                 | C1   |
| M2 Portfólio                                   | `/portfolio`                                        | C2   |
| M3 Serviços (passo 1)                          | `/servicos`, `/agendar`                             | C3   |
| M4 Data e horário · D2 desktop                 | `/agendar/[servico]/horario`                        | C4   |
| M5 Seus dados · M6 Confirmado                  | `/agendar/[servico]/dados`, `/agendamento/[codigo]` | C5   |
| M7 Meus horários · M8 Editar (sheet)           | `/meus-horarios`, `/meus-horarios/[id]`             | C6   |
| Entrar / criar conta                           | `/entrar`, `/cadastro`, `/admin/entrar`             | A5   |
| A1 Dashboard · AM1 mobile                      | `/admin`                                            | B2   |
| A2 Agenda + detalhe · AM2 agenda do dia        | `/admin/agenda`                                     | B5   |
| A3 Cadastro de serviço                         | `/admin/servicos`, `/admin/servicos/[id]`           | B3   |
| A4 Disponibilidade + bloquear/liberar          | `/admin/disponibilidade`                            | B4   |
| A5 Despesas                                    | `/admin/despesas`                                   | B8   |
| A6 Editor de portfólio                         | `/admin/portfolio`                                  | B7   |
| Clientes (no fluxo)                            | `/admin/clientes`, `/admin/clientes/[id]`           | B6   |
| Bio & links / Editar página pública (no fluxo) | `/admin/bio`                                        | B9   |

## 3. Stack e decisões

| Camada    | Escolha                                                                                                                             | Motivo                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Framework | Next.js 15 (App Router, Server Actions), TypeScript                                                                                 | Front e back num projeto; mesmo padrão dos outros projetos do usuário                     |
| UI        | Tailwind CSS v4 + shadcn/ui (Radix) + lucide-react                                                                                  | Tokens viram variáveis CSS; componentes acessíveis; ícones lineares 1,5 px como no design |
| Gráficos  | Recharts                                                                                                                            | Barras faturamento × despesas e anel de ocupação do dashboard                             |
| Dados     | Prisma + PostgreSQL (Docker local; Neon em produção)                                                                                | Consultas por intervalo de datas e relatórios                                             |
| Arquivos  | Vercel Blob (produção) / pasta `public/uploads` (dev)                                                                               | Fotos de serviços, portfólio e comprovantes                                               |
| Auth      | Auth.js v5; admin por e-mail+senha; cliente por e-mail+senha ou **sem cadastro** (nome + WhatsApp, link de gerenciamento com token) | Reflete a decisão "Como quer continuar?" do fluxo                                         |
| Validação | Zod em formulários e Server Actions                                                                                                 | Um schema para cliente e servidor                                                         |
| Datas     | date-fns + date-fns-tz, fuso `America/Sao_Paulo`                                                                                    | O motor de horários depende de fuso correto                                               |
| Mensagens | Interface `Notifier` com implementações e-mail (Resend) e WhatsApp (provedor a definir; inicialmente link `wa.me`)                  | O design promete lembrete no WhatsApp; provedor é decisão do usuário                      |
| Testes    | Vitest (motor de horários, regras de cancelamento, finanças) + Playwright (fluxo ponta a ponta)                                     | A lógica de disponibilidade é o que mais quebra                                           |
| CI/Deploy | GitHub Actions + Vercel                                                                                                             | Preview por PR, produção no `main`                                                        |

Tema escuro único (o Figma não tem tema claro). Breakpoints: mobile 390, desktop ≥ 1024
(admin usa sidebar; cliente usa header com menu).

## 4. Modelo de dados (Prisma)

- `User` — id, nome, e-mail?, whatsapp, senhaHash?, `role` (ADMIN | CLIENT), criadoEm
- `Business` — id, `ownerId`, nome, slug, tagline, descrição, logoUrl, fotoUrl, instagram, whatsapp, endereço, bairro, horárioResumo, codigoPrefixo (`LF`), minAntecedenciaCancelamentoHoras (24)
- `ServiceCategory` — id, `businessId`, nome, ordem (Alongamento, Manutenção, Esmaltação, Nail art, Blindagem)
- `Service` — id, `businessId`, `categoryId`, título, descrição, duracaoMin, reorganizacaoMin, precoCentavos, precoAPartir (bool, "R$ 15+"), visível, ordem, fotos[]
- `WorkingHours` — id, `businessId`, diaSemana, ativo, inicio, fim, pausaInicio?, pausaFim?
- `ScheduleException` — id, `businessId`, tipo (BLOCK | RELEASE), inicio, fim, diaInteiro, motivo
- `Appointment` — id, `businessId`, `clientId`, `serviceId`, inicio, fim (inclui reorganização), fimAtendimento, status (PENDING | CONFIRMED | DONE | CANCELLED | NO_SHOW), código (`LF-2481`), observação, precoCentavos (congelado), origem (CLIENT | ADMIN), tokenGerenciamento (sem cadastro), canceladoEm, canceladoPor
- `ClientNote` — id, `businessId`, `clientId`, texto, criadoEm
- `Album` — id, `businessId`, nome, ordem
- `Photo` — id, `businessId`, `albumId`?, `serviceId`?, url, legenda, capa, destaqueNaBio, botaoQueroEsse, ordem
- `Expense` — id, `businessId`, descrição, categoria, data, valorCentavos, tipo (FIXA | VARIAVEL), recorrência (NONE | MONTHLY), comprovanteUrl?
- `Reminder` — id, `appointmentId`, canal (EMAIL | WHATSAPP), tipo (CONFIRMACAO | 24H | 2H), enviarEm, enviadoEm?, status

Invariante: um `Appointment` ativo só existe se [inicio, fim) cabe em `WorkingHours` ou numa
`ScheduleException` RELEASE, não cruza BLOCK nem outro `Appointment` ativo. Verificado em
transação no banco (SELECT ... FOR UPDATE no dia), nunca só no cliente.

## 5. Estrutura de pastas

```
src/
  app/
    (public)/                  bio, portfólio, serviços, agendar, agendamento/[codigo]
    (client)/meus-horarios/    área da cliente logada ou via token
    (auth)/entrar, cadastro, admin/entrar
    (admin)/admin/             dashboard, agenda, servicos, disponibilidade, portfolio, despesas, clientes, bio
    api/cron/reminders         disparo de lembretes (Vercel Cron)
  features/<dominio>/          actions.ts, queries.ts, schemas.ts, components/
  lib/
    scheduling/                motor de horários (puro) + testes
    finance/                   receita, despesas, lucro, ocupação (puro) + testes
    notifications/             Notifier, EmailNotifier, WhatsAppNotifier
    prisma.ts, auth.ts, dates.ts, money.ts, codes.ts
  components/ui/               shadcn ajustado aos tokens
  components/layout/           BottomNav, Sidebar, PublicHeader, PageHeader
prisma/                        schema, migrations, seed
tests/e2e/                     Playwright
docs/                          PLANO.md, design-tokens.md, decisoes.md
```

## 6. Sequência de commits

Formato: `tipo(escopo): descrição` em português. Antes de cada commit: `pnpm lint && pnpm typecheck && pnpm test`.
Push ao fim de cada fase. Cada commit lista entregas e critério de pronto.

### Fase A — Fundação (5 commits)

**A1 `chore: scaffold do Next.js com TypeScript, Tailwind e lint`**

- `create-next-app` (App Router, `src/`, TS, Tailwind v4, ESLint), Prettier, `.editorconfig`, `.nvmrc`, pnpm, scripts `lint`, `typecheck`, `test`, `db:*`.
- Pronto quando `pnpm dev` abre uma página vazia e `pnpm lint && pnpm typecheck` passam.

**A2 `feat(design): tokens, fontes e tema escuro do Figma`**

- `globals.css` com todas as variáveis de [design-tokens.md](design-tokens.md); `@theme` do Tailwind mapeando cores, raios e fontes; DM Sans e Montserrat via `next/font/google`; classes utilitárias `display-xl`, `display-l`, `display-label`, `h1`…`caption`; gradiente e glow do botão primário; fundo radial do hero.
- Logo "LF" exportada do Figma em SVG (nó do brand board) para `public/brand/`.
- Pronto quando `/dev/tokens` mostra paleta, escala tipográfica e gradientes iguais ao brand board.

**A3 `feat(ui): kit de componentes ajustado ao design`**

- shadcn: Button (primary gradient+glow, secondary outline, ghost, danger-text), Chip/filtro, Card, Input e Textarea com ícone e rótulo caption, Select, Switch, Tabs e SegmentedControl, Badge de status, Sheet inferior (raio 24, alça), Dialog, Calendar (dias com ponto verde/cinza/riscado), SlotButton, KpiCard, SummaryList, InfoBox, EmptyState, Skeleton, Toast (sonner), Avatar com iniciais, Stepper (passo 1/2/3).
- Layouts: `BottomNav` (cliente 4 itens, admin 5), `Sidebar` admin, `PublicHeader` desktop, `PageHeader` (label caps + título).
- Pronto quando `/dev/ui` renderiza tudo e a comparação visual com as telas M1 e A1 é aceita.

**A4 `feat(db): schema Prisma, Docker Compose e seed`**

- `docker-compose.yml` (Postgres 16), `.env.example`, schema da seção 4, migration inicial.
- Seed = dados do Figma: Letícia Fagundes / Studio LF, 5 categorias, serviços Alongamento em gel (2h+15, R$ 180), Manutenção (1h+15, R$ 110), Blindagem (1h15+10, R$ 95), Nail art (30m+5, a partir de R$ 15); horários seg–sáb 09–19 com pausa 12:30–13:45; bloqueios de exemplo; 24 fotos placeholder em 3 álbuns; 7 despesas de outubro; clientes Mariana, Juliana, Camila (sem cadastro), Ana Beatriz e agendamentos do mês.
- Pronto quando `pnpm db:reset` migra e popula; `prisma studio` mostra os dados.

**A5 `feat(auth): login da profissional, conta da cliente e acesso sem cadastro`**

- Auth.js Credentials com bcrypt; `/admin/entrar`; `/entrar` e `/cadastro` da cliente; middleware protege `/admin` (ADMIN) e `/meus-horarios` (CLIENT ou token válido na URL).
- Pronto quando admin do seed entra no painel, cliente entra em meus horários, e um link com token abre o agendamento sem login.

### Fase B — Motor de horários e painel da profissional (9 commits)

**B1 `feat(scheduling): motor de horários com testes`**

- `lib/scheduling/`: `getAvailableSlots({ dia, serviço, workingHours, exceptions, appointments, passoMin: 15, agora })` → inícios possíveis; `getMonthAvailability` → por dia: `available | full | closed`; `hasConflict` para a transação de criação.
- Testes Vitest: dia normal, pausa de almoço, serviço que não cabe antes da pausa, reorganização bloqueando o slot seguinte, BLOCK por faixa/dia/mês, RELEASE em dia fechado, horário no passado, fuso, mês inteiro em menos de 50 ms.
- Pronto quando os testes passam e o cenário do frame "Como os horários livres são calculados" (09:00 alongamento 2h, manutenção 11:15, almoço, esmaltação 13:45, livre 15:30–19:00) é reproduzido num teste.

**B2 `feat(admin): shell, dashboard e versão mobile`**

- Sidebar/BottomNav admin, cabeçalho com data e saudação, ações "Bloquear horário" e "+ Novo agendamento".
- Dashboard: seletor Dia/Semana/Mês/Ano; KPIs Faturamento, Atendimentos, Ticket médio, Lucro líquido com variação vs. período anterior; gráfico Faturamento × Despesas por semana; anel de ocupação (horas agendadas / disponíveis); Agenda de hoje; Serviços mais vendidos. AM1: KPIs em grade 2×2, card "Próximo atendimento", atalhos Agendar/Bloquear/Despesa.
- `lib/finance/` puro com testes para receita (apenas DONE), lucro, ocupação, ticket médio.
- Pronto quando o dashboard reproduz os números do seed.

**B3 `feat(services): cadastro e lista de serviços`**

- Lista com preço, duração, status, reordenar, ativar/ocultar. Formulário A3: título, descrição, categoria (chips), fotos (upload múltiplo, até 5 MB), duração e reorganização com stepper, valor, "a partir de", visível. Painel lateral com pré-visualização do card da cliente e "Impacto na agenda" (duração total e quantos cabem por dia).
- Pronto quando criar um serviço o faz aparecer no catálogo público e nos slots.

**B4 `feat(availability): horário de funcionamento e bloquear/liberar`**

- Horário por dia da semana com toggle, início/fim e pausa. Modal "Bloquear ou liberar": abas Bloquear/Liberar; período Mês inteiro / Dia(s) / Faixa de horário; data, de, até; motivo; aviso de impacto. Lista "Bloqueios e exceções" com remover.
- Pronto quando um bloqueio some da agenda da cliente na hora e uma liberação abre horário em dia fechado.

**B5 `feat(agenda): visão dia/semana/mês com detalhe e ações`**

- Grade semanal 09–19 com blocos coloridos (agendado magenta, intervalo marrom, bloqueado cinza tracejado); navegação Hoje/anterior/próximo; visão dia (AM2 no mobile) e mês.
- Painel lateral "Detalhe do agendamento": cliente (com/sem cadastro, nº de visitas), status, serviço, data, horário (+reorganização), valor, WhatsApp, observação; ações Marcar como concluído, Remarcar, Falta, Cancelar.
- "+ Novo agendamento" manual: cliente existente ou nova, serviço, data/horário via motor.
- Pronto quando cada ação muda status, libera/ocupa slot e reflete no dashboard.

**B6 `feat(clients): lista e ficha da cliente`**

- Busca por nome/WhatsApp; ficha com visitas, próximos e anteriores, total gasto, anotações (`ClientNote`), botão WhatsApp.
- Pronto quando a ficha da Mariana mostra 6 visitas conforme o seed.

**B7 `feat(portfolio): álbuns, fotos e editor`**

- Upload múltiplo com drag-and-drop, filtros por álbum, marcar capa, painel "Foto selecionada": legenda, vincular ao serviço, álbum, destaque na bio, botão "Quero esse"; excluir.
- Pronto quando uma foto com destaque aparece em "Destaques do portfólio" na bio.

**B8 `feat(expenses): despesas e relatório financeiro`**

- KPIs Despesas do mês / Fixas / Variáveis; tabela (descrição, categoria, data, recorrência, valor); modal "Lançar despesa" (valor, data, categoria, fixa/variável, recorrência mensal, comprovante); "Por categoria" com barras; "Lucro do mês"; Exportar CSV.
- Recorrência mensal gera lançamentos futuros ao abrir o mês.
- Pronto quando os totais batem com o dashboard (lucro = receita concluída − despesas).

**B9 `feat(bio): editar página pública`**

- Formulário: nome, tagline, apresentação, foto/logo, Instagram, WhatsApp, endereço, horário resumido, estatísticas (atendimentos, nota), com pré-visualização ao vivo da bio.
- Pronto quando salvar atualiza `/` imediatamente.

### Fase C — Jornada da cliente (6 commits)

**C1 `feat(public): bio / início (M1, D1)`**

- Hero com logo, nome em Display, tagline, horário e "+1.200 atendimentos"; botão "Agendar horário"; "Próximos horários livres" (3 chips reais vindos do motor) com "Ver agenda"; links Instagram, WhatsApp, Serviços e valores; "Destaques do portfólio"; BottomNav cliente. Desktop: header com menu, hero em duas colunas com mosaico de fotos, estatísticas, catálogo em 4 colunas, rodapé com endereço.
- Metadata e Open Graph com logo.
- Pronto quando a página reproduz M1 no mobile e D1 no desktop.

**C2 `feat(public): portfólio (M2)`**

- Grade masonry 2 colunas, filtros por álbum, foto em tela cheia com legenda e botão "Quero esse" → serviço vinculado.
- Pronto quando "Quero esse" abre o passo 2 já com o serviço.

**C3 `feat(booking): catálogo e passo 1 (M3)`**

- Busca, chips de categoria, cards com foto, descrição, duração + intervalo, preço, "Agendar". Stepper "Passo 1 de 3".
- Pronto quando "Agendar" leva ao passo 2 com o serviço no resumo.

**C4 `feat(booking): passo 2 data e horário (M4, D2)`**

- Card do serviço com "Trocar"; calendário mensal com estados por dia (motor `getMonthAvailability`); slots Manhã/Tarde com disponível/selecionado/indisponível; aviso "calculados para Xh + Y min"; barra fixa com "Qui, 5/11 às 14:15 · término previsto 16:15" e Continuar. Desktop em 3 colunas com resumo e total.
- Pronto quando o conjunto de slots muda ao bloquear no painel (teste e2e depois).

**C5 `feat(booking): passo 3 seus dados, confirmação e comprovante (M5, M6)`**

- Abas "Sem cadastro" / "Entrar / criar conta"; nome, WhatsApp, observações; switch "Salvar meus dados"; resumo; "Confirmar agendamento".
- Criação em transação com `hasConflict`; erro amigável se o horário acabou de ser ocupado; gera código `LF-xxxx` e token de gerenciamento.
- Tela "Horário confirmado!" com comprovante, local, pagamento no local, "Adicionar ao calendário" (.ics), "Ver meus horários"; envio da confirmação via `Notifier`.
- Pronto quando dois pedidos simultâneos no mesmo slot resultam em um sucesso e um erro tratado (teste).

**C6 `feat(client): meus horários e editar agendamento (M7, M8)`**

- Abas Próximos/Anteriores; cards com data em destaque, status, ações Remarcar, Serviço, Cancelar; sheet "Editar agendamento": trocar dia/horário, trocar serviço (recalcula), cancelar (gratuito até 24 h, depois orienta WhatsApp). Acesso logado ou por link com token.
- Pronto quando cancelar libera o slot e remarcar mantém o código.

### Fase D — Automação, qualidade e entrega (5 commits)

**D1 `feat(reminders): confirmação e lembretes 24 h / 2 h`**

- `Reminder` criado junto com o agendamento; `api/cron/reminders` (Vercel Cron a cada 15 min) envia pendentes; `EmailNotifier` (Resend) e `WhatsAppNotifier` (provedor a definir; até lá, gera link `wa.me` com texto pronto para a profissional). Botões Confirmar/Remarcar no lembrete apontam para o link de gerenciamento.
- Pronto quando um agendamento do seed gera 3 reminders e o cron os marca como enviados.

**D2 `feat(pwa): manifest, ícones e ajustes de toque`**

- `manifest.webmanifest`, ícone circular "LF" do brand board, `theme-color #0E0A0C`, `viewport-fit=cover`, sem zoom em inputs, sem flash de tap, safe-area na BottomNav.
- Pronto quando o Lighthouse marca como instalável.

**D3 `test(e2e): fluxo ponta a ponta com Playwright`**

- Admin cria serviço e bloqueia tarde → cliente sem cadastro agenda de manhã → admin confirma e conclui → dashboard soma receita → cliente cancela outro via link com token.
- Pronto quando roda verde contra banco de teste.

**D4 `ci: GitHub Actions com lint, typecheck, unit e e2e`**

- Workflow em PR e `main`, Postgres como service container, cache do pnpm, upload do relatório Playwright.

**D5 `docs: README de desenvolvimento, variáveis e deploy`**

- Rodar local, seed, variáveis, deploy Vercel + Neon + Blob + Resend, cron, links do Figma e deste plano.

## 7. Ordem e marcos

1. Fase A (5 commits) → "projeto roda com tema, componentes, banco e login".
2. B1–B5 → "profissional opera a agenda sozinha".
3. C1–C6 → "cliente agenda de ponta a ponta" (MVP utilizável).
4. B6–B9, D1–D5 → "pronto para produção".

Total: 25 commits. Cada fase cabe numa sessão de trabalho; o usuário valida visualmente ao fim de cada fase comparando com as telas do Figma.

## 8. Decisões pendentes (não bloqueiam a Fase A)

- **Provedor de WhatsApp** para lembretes automáticos (Meta Cloud API, Z-API, Twilio) ou começar só com e-mail + link `wa.me` manual. Decidir até D1.
- **Banco em produção:** Neon (sugerido) ou Supabase.
- **Domínio** da página pública (afeta o link na bio e os ícones PWA).
