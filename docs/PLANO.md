# Plano de criação do web app MinhaAgenda

Plano de execução para construir o web app a partir do design no Figma
([arquivo](https://www.figma.com/design/iTZZOI3KZwIkgRNLdkFLlh/MinhaAgenda-%E2%80%94-Fluxo-de-P%C3%A1ginas---Identidade-Visual--c%C3%B3pia-)).
Cada etapa termina em **um commit** que compila, passa no lint e nos testes existentes.
O plano é executado pelo Claude Code; o usuário valida ao final de cada fase.

## 1. Produto

**O que é:** agenda online para profissionais de nails (manicure, nail designer).
A profissional configura serviços e horários; a cliente agenda pelo celular sem precisar
falar no WhatsApp. "Personalizada" porque a profissional aplica a própria marca
(nome, logo, cor) na página que a cliente vê.

**Dois perfis, dois fluxos** (página "03 · Telas (Cliente & Admin)" do Figma):

| Perfil | O que faz |
|---|---|
| Cliente | Vê a página do estúdio, escolhe serviço, data e horário, confirma, acompanha e cancela/remarca os próprios agendamentos |
| Admin (profissional) | Agenda do dia/semana, confirma/conclui/cancela, cadastra serviços, define horários e folgas, vê clientes e histórico, personaliza a marca |

**Fora do escopo da v1:** pagamento online, múltiplas profissionais por estúdio, app nativo (o web app é instalável como PWA).

## 2. Stack e decisões

| Camada | Escolha | Motivo |
|---|---|---|
| Framework | Next.js 15 (App Router, Server Actions), TypeScript | Um projeto só para front e back; mesmo padrão dos outros projetos do usuário |
| UI | Tailwind CSS v4 + shadcn/ui (Radix) | Tokens do Figma viram variáveis CSS; componentes acessíveis prontos para ajustar ao design |
| Dados | Prisma + PostgreSQL (Docker local, Neon/Supabase em produção) | Agenda tem relações e consultas por intervalo de datas |
| Auth | Auth.js v5 (e-mail + senha, Google opcional), papéis `ADMIN` e `CLIENT` | Fluxos distintos exigem autorização por papel |
| Validação | Zod em formulários e Server Actions | Uma definição de schema para cliente e servidor |
| Datas | date-fns + date-fns-tz, fuso `America/Sao_Paulo` | Cálculo de slots depende de fuso correto |
| Testes | Vitest (unidade: slots, regras) + Playwright (fumaça e2e) | A lógica de disponibilidade é a parte que mais quebra |
| CI/Deploy | GitHub Actions (lint, typecheck, test) + Vercel | Preview por PR, produção no `main` |

Mobile-first: todas as telas desenhadas para 390px, expandindo para desktop no admin.

## 3. Modelo de dados (Prisma)

- `User` — id, nome, e-mail, senha (hash), telefone, `role` (ADMIN | CLIENT), avatar
- `Business` — id, `ownerId`, nome, slug (URL pública `/{slug}`), logo, corPrimaria, descrição, endereço, Instagram/WhatsApp
- `Service` — id, `businessId`, nome, descrição, duracaoMin, precoCentavos, ativo, ordem
- `WorkingHours` — id, `businessId`, diaSemana (0–6), inicio, fim, intervaloInicio?, intervaloFim?
- `TimeOff` — id, `businessId`, inicio, fim, motivo (folgas, feriados, bloqueios)
- `Appointment` — id, `businessId`, `clientId`, `serviceId`, inicio, fim, `status` (PENDING | CONFIRMED | DONE | CANCELLED | NO_SHOW), observacao, canceladoPor
- `ClientNote` — id, `businessId`, `clientId`, texto (anotações da profissional sobre a cliente)

Regra central: um `Appointment` só é criado se o intervalo [inicio, fim) cabe em `WorkingHours`,
não colide com `TimeOff` nem com outro `Appointment` ativo. Validado no banco por
transação com verificação de conflito, nunca só no cliente.

## 4. Estrutura de pastas

```
src/
  app/
    (public)/[slug]/            página do estúdio + fluxo de agendamento
    (client)/minha-agenda/      agendamentos da cliente, perfil
    (admin)/admin/              dashboard, agenda, serviços, horários, clientes, marca
    (auth)/entrar, cadastro
    api/                        apenas webhooks/health; o resto é Server Action
  features/<dominio>/           actions.ts, queries.ts, schemas.ts, components/
  lib/                          prisma, auth, slots (lógica pura), datas, utils
  components/ui/                shadcn ajustado aos tokens do Figma
prisma/                         schema, migrations, seed
tests/                          unit (vitest) e e2e (playwright)
docs/                           este plano, decisões, tokens extraídos do Figma
```

## 5. Sequência de commits

Formato: `tipo(escopo): descrição` em português. Antes de cada commit: `pnpm lint && pnpm typecheck && pnpm test`.
Push ao fim de cada fase. Cada commit abaixo lista entregas e critério de pronto.

### Fase A — Fundação

**A1 `chore: scaffold do Next.js com TypeScript, Tailwind e lint`**
- `create-next-app` (App Router, src/, TS, Tailwind, ESLint), Prettier, `.editorconfig`, `.nvmrc`, scripts `lint`, `typecheck`, `test`.
- Pronto quando `pnpm dev` abre a página inicial e `pnpm lint && pnpm typecheck` passam.

**A2 `feat(design): tokens de identidade visual e fontes do Figma`**
- Extrair da página "01 · Identidade Visual": paleta, tipografia, raios, sombras, espaçamentos. Registrar em `docs/design-tokens.md` e em variáveis CSS no `globals.css` (`--color-primary`, `--radius`, etc.). Fontes via `next/font`.
- Tema claro (e escuro, se o Figma tiver). Depende de ler o Figma; ver seção 7.
- Pronto quando uma página de amostra mostra todos os tokens aplicados.

**A3 `feat(ui): componentes base ajustados ao design`**
- shadcn/ui: Button, Input, Label, Card, Sheet/Drawer, Dialog, Tabs, Badge, Avatar, Calendar, Toast (sonner), Skeleton. Ajustar variantes às do Figma.
- Pronto quando `/dev/ui` (rota só em desenvolvimento) renderiza todos os componentes.

**A4 `feat(db): schema Prisma, Docker Compose e seed`**
- `docker-compose.yml` com Postgres, `.env.example`, schema da seção 3, migration inicial, seed com 1 estúdio, 4 serviços, horários seg–sáb, 1 admin e 2 clientes.
- Pronto quando `pnpm db:reset` sobe o banco, migra e popula.

**A5 `feat(auth): login, cadastro e autorização por papel`**
- Auth.js com Credentials (bcrypt), sessão JWT, `middleware.ts` protegendo `/admin` (ADMIN) e `/minha-agenda` (CLIENT). Telas Entrar e Cadastro conforme o Figma.
- Pronto quando admin e cliente do seed logam e caem nas áreas corretas; acesso cruzado redireciona.

### Fase B — Lado da profissional (admin)

**B1 `feat(admin): shell de navegação e dashboard do dia`**
- Layout admin (nav inferior no mobile, lateral no desktop), dashboard com agendamentos de hoje, próximos, contagem de pendentes.
- Pronto quando o dashboard reflete o seed.

**B2 `feat(services): CRUD de serviços`**
- Lista, criar, editar, ativar/desativar, reordenar. Server Actions com Zod; `revalidatePath`.
- Pronto quando um serviço criado aparece para a cliente na página pública.

**B3 `feat(schedule): horários de atendimento e bloqueios`**
- Tela de horários por dia da semana com intervalo; tela de folgas/bloqueios por período.
- Pronto quando alterações refletem nos slots (B4).

**B4 `feat(slots): cálculo de horários disponíveis`**
- `lib/slots.ts` puro: dados `WorkingHours`, `TimeOff`, `Appointment[]`, duração do serviço, passo (ex.: 15 min) → lista de inícios possíveis em um dia. Sem acesso ao banco.
- Testes Vitest: dia normal, intervalo de almoço, folga, colisão parcial, serviço longo no fim do dia, fuso horário, horário no passado.
- Pronto quando os testes passam e o cálculo roda abaixo de 50 ms para um mês.

**B5 `feat(admin): agenda diária e semanal com ações`**
- Visão dia (timeline) e semana; abrir agendamento; confirmar, concluir, marcar falta, cancelar, remarcar; criar agendamento manual para uma cliente.
- Pronto quando cada ação muda o status e some/aparece nos slots.

**B6 `feat(clients): lista de clientes e histórico`**
- Busca por nome/telefone, ficha com histórico de agendamentos e anotações (`ClientNote`).
- Pronto quando a ficha mostra o histórico do seed.

**B7 `feat(branding): personalização da marca`**
- Nome, slug, logo (upload para Vercel Blob ou pasta local em dev), cor primária (aplica `--color-primary` na página pública), descrição, contatos.
- Pronto quando alterar a cor muda a página pública imediatamente.

### Fase C — Lado da cliente

**C1 `feat(public): página do estúdio`**
- `/{slug}`: marca, serviços com preço e duração, botão agendar, contatos. SEO básico (metadata, OG).
- Pronto quando a página do seed renderiza com a marca personalizada.

**C2 `feat(booking): fluxo de agendamento`**
- Passos conforme "02 · Fluxo de Páginas": serviço → data (calendário com dias disponíveis) → horário (slots de B4) → identificação (login/cadastro rápido ou dados mínimos) → confirmação.
- Criação em transação com verificação de conflito; mensagem clara se o horário acabou de ser ocupado.
- Pronto quando dois agendamentos simultâneos no mesmo slot resultam em um sucesso e um erro tratado (teste).

**C3 `feat(client): meus agendamentos`**
- Lista próximos e passados; cancelar (respeitando prazo mínimo configurável, ex.: 24 h); remarcar reaproveitando C2; perfil (nome, telefone).
- Pronto quando o cancelamento libera o slot.

### Fase D — Qualidade e entrega

**D1 `feat(pwa): manifest, ícones e meta tags`**
- `manifest.webmanifest`, ícones a partir do logo do Figma, `theme-color`, viewport-fit, ajustes de toque (sem zoom em input, sem flash de tap).
- Pronto quando o Lighthouse marca como instalável.

**D2 `test(e2e): fumaça com Playwright`**
- Cenários: admin cria serviço → cliente agenda → admin confirma → cliente vê confirmado → cliente cancela.
- Pronto quando roda verde contra o banco de teste.

**D3 `ci: GitHub Actions com lint, typecheck, unit e e2e`**
- Workflow em PR e `main`, Postgres como service container, cache do pnpm.
- Pronto quando o badge fica verde no repositório.

**D4 `docs: README de desenvolvimento, variáveis de ambiente e deploy`**
- Como rodar local, seed, variáveis, deploy na Vercel + banco gerenciado, link do Figma e deste plano.

**D5 (opcional) `feat(notify): lembretes por e-mail`**
- Resend + cron da Vercel: confirmação na criação e lembrete 24 h antes. Link "chamar no WhatsApp" na ficha.

## 6. Ordem e marcos

1. Fase A inteira (5 commits) → marco "projeto roda com login e banco".
2. Fase B até B5 → marco "profissional consegue operar a agenda sozinha".
3. Fase C → marco "cliente agenda de ponta a ponta" (MVP utilizável).
4. B6, B7, Fase D → marco "pronto para produção".

Estimativa de execução: 20 commits; cada fase em uma sessão de trabalho.

## 7. Pendências antes de executar

- **Leitura do Figma.** A integração Figma do Claude Code está no plano Starter e atingiu o limite de chamadas. Para A2, A3 e as telas, preciso de uma destas opções: (a) capturas de tela das três páginas do arquivo; (b) o arquivo compartilhado publicamente com link de visualização; (c) aguardar o limite liberar. Até lá, A2/A3 ficam com tokens provisórios a serem trocados.
- **Confirmar escopo** com o usuário: múltiplas profissionais por estúdio? pagamento/sinal? lembrete por WhatsApp ou só e-mail?
- **Banco em produção:** Neon ou Supabase (ambos gratuitos para começar).
