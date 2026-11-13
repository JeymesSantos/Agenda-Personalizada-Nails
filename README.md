# MinhaAgenda — agenda online para nail designer

Web app de agendamento para a nail designer **Letícia Fagundes (Studio LF)**, construído a
partir do design no Figma. Duas jornadas ligadas por um motor de horários:

- **Cliente (mobile-first, responsivo):** entra pelo link na bio do Instagram, vê portfólio e
  catálogo, escolhe serviço → data e horário → seus dados (com ou sem cadastro) → confirmação.
  Depois acompanha, remarca ou cancela em "Meus horários".
- **Profissional (admin, desktop e celular):** dashboard com KPIs, agenda dia/semana/mês com
  detalhe e ações, serviços, disponibilidade com bloqueios/liberações, portfólio, despesas,
  clientes e edição da página pública.

**Regra central:** cada serviço ocupa `duração + tempo de reorganização`; o próximo horário só
abre depois disso. Bloqueios (almoço, folga, mês fechado) e agendamentos existentes são removidos
antes de mostrar os horários livres. Tudo calculado em tempo real no fuso `America/Sao_Paulo`.

Documentos de apoio:

- [docs/PLANO.md](docs/PLANO.md) — plano de execução por fases, telas do Figma → rotas,
  decisões e registro do que já foi entregue.
- [docs/design-tokens.md](docs/design-tokens.md) — cores, tipografia e componentes do brand board.
- [Arquivo Figma](https://www.figma.com/design/iTZZOI3KZwIkgRNLdkFLlh/MinhaAgenda-%E2%80%94-Fluxo-de-P%C3%A1ginas---Identidade-Visual--c%C3%B3pia-)
  — páginas "01 · Identidade Visual", "02 · Fluxo de Páginas" e "03 · Telas (Cliente & Admin)".

## Status

| Fase                                             | Situação                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------- |
| A — Fundação (Next, tokens, kit de UI, DB, auth) | Concluída                                                                    |
| B — Motor de horários e painel da profissional   | Concluída                                                                    |
| C — Jornada da cliente                           | Concluída                                                                    |
| D — Lembretes, PWA, e2e, CI, deploy              | Em andamento: D1 lembretes, D2 PWA e D3 e2e concluídos; falta GitHub Actions |

## Stack

| Camada     | Escolha                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Server Components, Server Actions, Turbopack) + React 19, TypeScript   |
| UI         | Tailwind CSS v4, shadcn/ui (Radix), lucide-react, Recharts, sonner                             |
| Dados      | Prisma 7 + PostgreSQL (Docker local; Neon em produção)                                         |
| Auth       | Auth.js v5 (Credentials + bcrypt); admin por e-mail/senha; cliente com conta ou link com token |
| Validação  | Zod nos formulários e nas Server Actions                                                       |
| Datas      | date-fns + @date-fns/tz, fuso configurado por estúdio                                          |
| Arquivos   | `public/uploads` em desenvolvimento; Vercel Blob em produção (`BLOB_READ_WRITE_TOKEN`)         |
| Testes     | Vitest (unidade e integração)                                                                  |
| Formatação | ESLint + Prettier (plugin Tailwind)                                                            |

> **Atenção:** a versão do Next.js deste projeto tem mudanças em relação às versões anteriores
> (`proxy.ts` no lugar de `middleware.ts`, `params`/`searchParams` assíncronos, tipos
> `PageProps`/`LayoutProps` gerados). Consulte `node_modules/next/dist/docs/` antes de alterar
> rotas ou layouts.

## Requisitos

- Node.js 20.9 ou superior (desenvolvido com Node 24)
- pnpm 11 (`corepack enable` instala a versão fixada em `packageManager`)
- Docker Desktop (para o PostgreSQL local) ou um PostgreSQL 16 acessível

## Como executar localmente

```bash
# 1. dependências (o postinstall roda o prisma generate)
pnpm install

# 2. variáveis de ambiente
cp .env.example .env
# gere um segredo e cole em AUTH_SECRET:
openssl rand -base64 32

# 3. banco de dados (Postgres 16 em Docker, porta 5432)
pnpm db:up

# 4. schema + dados de exemplo do Figma
pnpm db:migrate     # aplica as migrations (cria o banco na primeira vez)
pnpm db:seed        # Letícia, serviços, horários, clientes, agendamentos, despesas, fotos

# 5. servidor de desenvolvimento
pnpm dev            # http://localhost:3000
```

Para zerar tudo e repopular: `pnpm db:reset` (apaga o banco, reaplica as migrations e roda o
seed). Para inspecionar os dados: `pnpm db:studio`.

### Contas do seed

| Perfil            | E-mail                    | Senha        | Onde entrar     |
| ----------------- | ------------------------- | ------------ | --------------- |
| Profissional      | `leticia@minhaagenda.app` | `leticia123` | `/admin/entrar` |
| Cliente com conta | `mariana@example.com`     | `cliente123` | `/entrar`       |
| Cliente com conta | `juliana@example.com`     | `cliente123` | `/entrar`       |
| Cliente com conta | `anabeatriz@example.com`  | `cliente123` | `/entrar`       |

Clientes sem cadastro (Camila, Rita, Paula, Nanda, Carla…) acessam seus agendamentos pelo link
com token de gerenciamento (`/meus-horarios?t=<token>`), o mesmo que vai na confirmação.

### Variáveis de ambiente

| Variável                        | Uso                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `DATABASE_URL`                  | Conexão Postgres. O valor do `.env.example` casa com o `docker-compose.yml`.             |
| `AUTH_SECRET`                   | Segredo do Auth.js (obrigatório).                                                        |
| `AUTH_URL`                      | URL pública da aplicação (`http://localhost:3000` em dev).                               |
| `TZ`                            | Fuso do processo Node; o fuso do estúdio também fica gravado em `Business.timezone`.     |
| `BLOB_READ_WRITE_TOKEN`         | Token do Vercel Blob. Sem ele os uploads vão para `public/uploads` (dev).                |
| `RESEND_API_KEY`, `EMAIL_FROM`  | Envio dos lembretes por e-mail (Resend). Sem chave, o e-mail só aparece no log.          |
| `CRON_SECRET`                   | Protege `GET /api/cron/reminders`; a Vercel envia no header `Authorization`.             |
| `E2E_DATABASE_URL`, `E2E_PORT`  | Banco e porta dos testes e2e (padrão: `minhaagenda_test` no mesmo Postgres, porta 3100). |
| `FIGMA_TOKEN`, `FIGMA_FILE_KEY` | Opcionais, só para scripts de extração do design.                                        |

## Scripts

| Comando            | O que faz                                                                |
| ------------------ | ------------------------------------------------------------------------ |
| `pnpm dev`         | Next.js em modo desenvolvimento (Turbopack)                              |
| `pnpm build`       | Build de produção                                                        |
| `pnpm start`       | Serve o build de produção                                                |
| `pnpm lint`        | ESLint                                                                   |
| `pnpm typecheck`   | `next typegen` + `tsc --noEmit`                                          |
| `pnpm format`      | Prettier em todo o projeto (`format:check` só verifica)                  |
| `pnpm test`        | Vitest (`test:watch` para modo interativo)                               |
| `pnpm test:e2e`    | Playwright: sobe a app em produção na porta 3100 contra o banco de teste |
| `pnpm test:e2e:ui` | O mesmo, no modo interativo do Playwright                                |
| `pnpm db:up`       | Sobe o Postgres do `docker-compose.yml`                                  |
| `pnpm db:down`     | Derruba o container (os dados ficam no volume)                           |
| `pnpm db:migrate`  | `prisma migrate dev`                                                     |
| `pnpm db:deploy`   | `prisma migrate deploy` (produção)                                       |
| `pnpm db:seed`     | Popula o banco com os dados do Figma (`prisma/seed.ts`)                  |
| `pnpm db:reset`    | Apaga, migra e semeia de novo                                            |
| `pnpm db:generate` | Regera o cliente Prisma em `src/generated/prisma`                        |
| `pnpm db:studio`   | Prisma Studio                                                            |

## Rotas

### Área pública e jornada da cliente (grupo `(public)`)

| Rota                           | Tela do Figma | Descrição                                                                                              |
| ------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------ |
| `/`                            | M1 / D1       | Bio / início: hero, próximos horários livres reais, links, destaques do portfólio; catálogo no desktop |
| `/portfolio`                   | M2            | Mosaico com filtros por álbum; `?foto=<id>` abre a foto com "Quero esse"                               |
| `/servicos`                    | M3            | Catálogo com busca e chips de categoria                                                                |
| `/agendar`                     | M3            | Passo 1 de 3: escolher serviço                                                                         |
| `/agendar/[serviceId]/horario` | M4 / D2       | Passo 2: calendário mensal + horários. `?data=AAAA-MM-DD`, `?mes=AAAA-MM`, `?h=<ISO>` pré-seleciona    |
| `/agendar/[serviceId]/dados`   | M5            | Passo 3: sem cadastro ou entrar/criar conta; exige `?h=<ISO>` do horário escolhido                     |
| `/agendamento/[code]`          | M6            | Comprovante "Horário confirmado!" (código `LF-xxxx`)                                                   |
| `/agendamento/[code]/ics`      | —             | Arquivo `.ics` para adicionar ao calendário                                                            |
| `/meus-horarios`               | M7            | Próximos / anteriores. Logada como cliente ou com `?t=<token>`                                         |
| `/meus-horarios/[id]/remarcar` | M8            | Trocar dia/horário (`?trocar=1` lista serviços; `?servico=<id>` recalcula); cancelar fica no sheet     |

### Autenticação (grupo `(auth)`)

| Rota             | Descrição                                           |
| ---------------- | --------------------------------------------------- |
| `/entrar`        | Login da cliente (`?next=` redireciona depois)      |
| `/cadastro`      | Criar conta de cliente                              |
| `/admin/entrar`  | Login da profissional                               |
| `/api/auth/*`    | Handlers do Auth.js                                 |
| `/api/auth/sair` | Encerra a sessão e redireciona para `?next=` ou `/` |

O `src/proxy.ts` protege `/admin/**` (exige ADMIN) e `/meus-horarios/**` (exige CLIENT ou
`?t=`), e manda quem já está logado para a própria área.

### Painel da profissional (grupo `(admin)`, exige ADMIN)

| Rota                     | Tela do Figma | Descrição                                                                                                                                                                |
| ------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/admin`                 | A1 / AM1      | Dashboard. `?periodo=dia\|semana\|mes\|ano`                                                                                                                              |
| `/admin/agenda`          | A2 / AM2      | `?visao=dia\|semana\|mes`, `?data=AAAA-MM-DD`, `?agendamento=<id>` abre o detalhe, `?novo=1` abre o diálogo de novo agendamento, `?cliente=<id>` pré-seleciona a cliente |
| `/admin/servicos`        | —             | Lista de serviços (ordem, ativar/ocultar)                                                                                                                                |
| `/admin/servicos/novo`   | A3            | Cadastro com prévia do card da cliente e impacto na agenda                                                                                                               |
| `/admin/servicos/[id]`   | A3            | Edição / exclusão                                                                                                                                                        |
| `/admin/disponibilidade` | A4            | Horário de funcionamento por dia + bloqueios/liberações. `?bloquear=1` abre o modal                                                                                      |
| `/admin/despesas`        | A5            | Despesas do mês (`?mes=AAAA-MM`), recorrência, categorias. `?nova=1` abre o lançamento                                                                                   |
| `/admin/despesas/export` | —             | CSV do mês (`?mes=AAAA-MM`), separador `;` e BOM para Excel pt-BR                                                                                                        |
| `/admin/portfolio`       | A6            | Álbuns, upload múltiplo, capa, destaque na bio, vínculo com serviço                                                                                                      |
| `/admin/clientes`        | —             | Lista com busca                                                                                                                                                          |
| `/admin/clientes/[id]`   | —             | Ficha: KPIs, histórico, anotações, contato                                                                                                                               |
| `/admin/bio`             | —             | Editar página pública com prévia ao vivo                                                                                                                                 |
| `/admin/fundos`          | —             | Fotos e vídeos de fundo: biblioteca (upload) e qual mídia aparece em cada tela, com véu por tela                                                                         |
| `/api/cron/reminders`    | —             | Envia os lembretes de e-mail vencidos (Vercel Cron a cada 15 min, `vercel.json`)                                                                                         |
| `/admin/mais`            | —             | Item "Mais" da barra inferior no celular (portfólio, clientes, bio, fundos, sair)                                                                                        |

### Desenvolvimento

| Rota          | Descrição                                              |
| ------------- | ------------------------------------------------------ |
| `/dev/tokens` | Paleta, escala tipográfica e gradientes do brand board |
| `/dev/ui`     | Galeria do kit de componentes                          |

## Lembretes (confirmação, 24 h e 2 h)

Ao criar ou remarcar um agendamento, `bookAppointment` chama `scheduleReminders`, que cria um
`Reminder` por canal da cliente (e-mail e/ou WhatsApp) e por tipo: confirmação (sai na hora),
24 h e 2 h antes (só se ainda cabem). Cancelar, concluir ou marcar falta cancela os pendentes;
reabrir volta a agendá-los (`src/features/reminders`).

- **E-mail**: `GET /api/cron/reminders` envia os vencidos via Resend (`RESEND_API_KEY`); sem chave,
  um notificador de console registra no log e marca como enviado, para testar em dev. Na Vercel o
  cron vem de `vercel.json`; fora dela, chame a rota com `Authorization: Bearer $CRON_SECRET`.
- **WhatsApp**: ainda sem provedor (decisão pendente no plano). O painel de detalhe do agendamento
  lista os lembretes e, para os de WhatsApp, oferece o link `wa.me` com o texto pronto e o botão
  "Marcar enviado".
- Os textos ficam em `templates.ts` (funções puras, com testes) e os botões apontam para o
  comprovante com o token de gerenciamento, onde a cliente remarca ou cancela sem cadastro.

## Fundos das telas (fotos e vídeos)

Atrás de todas as telas (área da cliente, login e painel) passa um slideshow de fotos e vídeos,
gerenciado em `/admin/fundos`:

- **Biblioteca**: cada mídia é enviada uma vez (`BackgroundMedia`). Fotos JPG/PNG/WebP até 5 MB;
  vídeos MP4/WebM até 50 MB, com pôster opcional (mostrado enquanto carrega e quando o vídeo não
  toca). O upload passa por `POST /api/uploads/background`, fora das Server Actions (limite de 1 MB);
  em produção o arquivo vai do navegador direto para o Vercel Blob.
- **Telas**: cada tela do enum `BackgroundPage` pode ter sua própria sequência
  (`BackgroundAssignment`) e véu (`BackgroundPageSetting`: leve, médio, denso). Tela sem mídia
  própria herda o `*_DEFAULT` da área. A rota é mapeada para a tela em
  `src/features/backgrounds/pages.ts`.
- **Enquadramento**: cada mídia tem um ponto de interesse (`focusX`/`focusY`, em %) aplicado como
  `object-position`; em `/admin/fundos` o botão de enquadrar abre a mídia inteira com um marcador
  arrastável e prévias de computador e celular.
- **Exibição**: `BackgroundSlideshow` (cliente) resolve a tela pela rota, troca foto a cada 7 s e
  vídeo ao terminar (teto de 20 s), mudo e em loop quando é a única mídia. Com "reduzir movimento"
  ou economia de dados mostra só a primeira mídia parada.

## Responsividade

Tema escuro único. Três faixas de largura (ver `docs/PLANO.md`, seção 3):

| Faixa            | Cliente                                          | Profissional                                                                             |
| ---------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| até 1023 px      | Telas M1–M8 com barra inferior                   | Telas AM1–AM2 com barra inferior; detalhe da agenda em sheet inferior                    |
| 1024 a 1279 px   | Header com menu, rodapé, passo 2 em três colunas | Sidebar de 264 px; conteúdo em coluna única; detalhe da agenda em sheet lateral          |
| a partir de 1280 | Igual, com margens de 80 px                      | Layouts em duas colunas, painel lateral da agenda, prévias fixas ao lado dos formulários |

Os breakpoints são os do Tailwind (`lg` = 1024, `xl` = 1280) e, no cliente, os mesmos valores
em `src/lib/use-media-query.ts`. O desktop do Figma foi desenhado em 1440 px.

## Estrutura do projeto

```
prisma/              schema, migrations e seed (dados do Figma)
docs/                PLANO.md e design-tokens.md
public/brand/        logo "LF" em SVG
public/hero*/        fotos de fundo iniciais (o seed as registra como padrão de cada área)
public/uploads/      arquivos enviados em desenvolvimento (ignorado pelo git)
src/app/
  (public)/          layout com header/rodapé/barra inferior e as páginas da cliente
  (auth)/            entrar, cadastro, admin/entrar
  (admin)/admin/     layout com sidebar/barra inferior e as páginas do painel
  api/               Auth.js, logout e upload das mídias de fundo
  dev/               tokens e galeria de UI
  globals.css        variáveis de design, @theme do Tailwind, utilitários tipográficos
src/components/
  ui/                kit shadcn ajustado ao design (Button, Card, Sheet, Calendar, SlotButton…)
  layout/            BottomNav, Sidebar, PublicHeader, PageHeader, BackgroundSlideshow
src/features/<área>/ queries.ts (leitura), actions.ts (Server Actions), schemas.ts (Zod), components/
  booking/core.ts    slotsForDay, monthAvailability, bookAppointment (transação serializável)
  backgrounds/       mídias de fundo: pages.ts (telas e rota → tela), queries, actions, upload
  reminders/         lembretes: plan.ts (quando), templates.ts (textos), core.ts (agendar/enviar)
src/lib/
  scheduling/        motor puro de horários (slots, intervalos) + testes
  finance/           receita, lucro, ocupação, ticket médio + testes
  auth.ts, session.ts, prisma.ts, dates.ts, money.ts, storage.ts, notifications.ts, use-media-query.ts
src/proxy.ts         controle de acesso por rota
src/generated/prisma cliente Prisma gerado (ignorado pelo git; pnpm db:generate)
tests/integration/   testes que usam o banco
tests/e2e/           Playwright: jornada ponta a ponta contra o banco de teste (global-setup, helpers)
```

Convenções: páginas são Server Components que leem via `queries.ts` e recebem estado pela URL
(`?visao=`, `?data=`, `?agendamento=`); mutações passam por Server Actions validadas com Zod;
componentes cliente só onde há interação. Cada etapa do plano termina em um commit que compila,
passa no lint e nos testes.

## Testes

```bash
pnpm test
```

- `src/lib/scheduling/slots.test.ts` — motor de horários (pausa, reorganização, bloqueios,
  liberações, passado, fuso, cenário do frame "Como os horários livres são calculados").
- `src/lib/finance/finance.test.ts` — receita (só DONE), lucro, ocupação, ticket médio.
- `tests/integration/booking.test.ts` — dois pedidos simultâneos no mesmo horário: um confirma e
  o outro recebe `UNAVAILABLE`. Precisa do Postgres do `pnpm db:up` com o seed aplicado.

### Ponta a ponta (Playwright)

`pnpm test:e2e` roda `tests/e2e/jornada.spec.ts`, a jornada do plano (D3): a profissional cria um
serviço e bloqueia uma tarde → uma cliente sem cadastro agenda de manhã (a tarde não aparece) →
a profissional conclui o atendimento → o dashboard soma a receita → a cliente cancela outro
agendamento pelo link com token. Cada passo também confere o banco.

- O `global-setup` cria o banco `minhaagenda_test` (se não existir), aplica as migrations e roda o
  seed; o `webServer` do Playwright faz `next build` e sobe `next start` na porta 3100 apontando
  para esse banco. Precisa do Postgres do docker compose no ar e do Chromium do Playwright
  (`pnpm exec playwright install chromium`, uma vez).
- Fora do CI o servidor de teste é reaproveitado se já estiver na porta 3100
  (`reuseExistingServer`). Falhas deixam trace, screenshot e contexto em `test-results/`.
- O acesso ao banco nos testes usa `pg` direto, porque o cliente Prisma gerado é ESM e o runner
  do Playwright não o carrega.

## Deploy (previsto na Fase D)

Vercel + Neon (Postgres) + Vercel Blob (fotos) + Resend (e-mail) + Vercel Cron para lembretes.
Variáveis mínimas em produção: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` e `BLOB_READ_WRITE_TOKEN`
(sem ele os uploads tentam gravar no disco, que não persiste na Vercel). Rode
`pnpm db:deploy` no build e `pnpm db:seed` uma vez se quiser os dados de exemplo.

## Problemas comuns

- **"Port 3000 is in use" / "Another next dev server is already running"** — há um `next dev`
  antigo; finalize o PID indicado (`taskkill /PID <pid> /F` no Windows) e rode `pnpm dev` de novo.
- **Erro fatal do Turbopack após uma edição com sintaxe inválida** — apague a pasta `.next` e
  suba o servidor novamente.
- **`prisma generate` falhou / tipos do Prisma ausentes** — `pnpm db:generate`.
- **Login não funciona** — confira `AUTH_SECRET` preenchido no `.env` e o banco semeado.
