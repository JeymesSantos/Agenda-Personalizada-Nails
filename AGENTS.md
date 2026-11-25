<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MinhaAgenda — instruções do projeto

## Contexto e fontes

Web app/PWA de agendamento para um studio de unhas, com jornada pública da cliente e painel
da profissional. A experiência deve funcionar no celular, tablet e desktop. Não é React Native.

- Stack e comandos: `package.json`, `README.md`, `.env.example` e `.github/workflows/ci.yml`.
- Domínio: `prisma/schema.prisma`, `src/features/booking/core.ts` e `src/lib/scheduling/`.
- Identidade visual: `docs/design-tokens.md`, `src/app/globals.css` e `src/components/ui/`.
- Histórico de decisões: `docs/PLANO.md` e `docs/AJUSTES-HOMOLOGACAO.md`. São registros históricos;
  quando divergirem do comportamento atual, confira o código e as decisões recentes do usuário.
- Guia das skills e adaptações: [docs/AGENTES.md](docs/AGENTES.md).

## Cinco regras obrigatórias para todos os agentes

Estas regras se aplicam ao agente principal e a qualquer agente delegado, em todas as tarefas.
As skills locais complementam estas regras e não podem dispensá-las.

1. **Se não conseguir, pare e avise.** Se não souber realizar a tarefa com segurança ou não
   conseguir executá-la, interrompa a tentativa e explique o impedimento ao usuário. Não
   improvise uma solução nem altere, remova ou desative algo que já estava pronto somente
   para fazer a nova tarefa funcionar. Preserve comportamentos existentes; se a tarefa
   exigir mudá-los além do escopo aprovado, apresente o impacto e aguarde autorização.
2. **Execute todos os checks da CI antes de concluir.** Sempre rode lint, formatação,
   verificação de tipos, testes unitários/de integração e testes ponta a ponta previstos em
   `.github/workflows/ci.yml`, mesmo em alterações de documentação ou estilo. Mostre os
   comandos, resultados e falhas ao usuário. Se algum check não puder executar ou falhar,
   informe o motivo e mantenha a tarefa como pendente de validação; não declare conclusão
   nem substitua a execução atual por resultados de um commit anterior.
3. **Faça mudanças pequenas e focadas.** Altere somente o necessário para a tarefa. Qualquer
   refatoração exige autorização explícita do usuário, inclusive dentro da funcionalidade
   afetada. Não misture limpeza, reorganização ou correções não relacionadas à entrega.
4. **Siga o padrão existente.** Reutilize arquitetura, componentes, convenções e ferramentas
   do projeto. Novas dependências, inclusive de desenvolvimento ou ferramentas auxiliares
   instaladas para a tarefa, só podem ser adicionadas com autorização explícita do usuário.
5. **Não publique configurações locais ou de ambiente.** Não inclua em staging, commits,
   push, PRs, artefatos publicados ou pacotes de deploy arquivos de configuração pessoais,
   valores de ambiente, credenciais, tokens ou arquivos locais de ferramentas. Confira o
   diff e os arquivos selecionados antes de publicar; `.gitignore` não protege arquivos já
   rastreados. Exemplos sanitizados e configurações compartilhadas já versionadas do projeto
   não devem receber valores reais ou específicos da máquina.

## Como trabalhar

- Comunique-se em português e informe o que foi alterado, a validação realizada e limitações reais.
- Antes de editar, confira branch, alterações existentes e instruções nos diretórios envolvidos.
  Preserve mudanças do usuário e não troque a branch por conta própria.
- Execute o trabalho autorizado até concluir. Não peça novamente autorização já concedida;
  dúvidas só devem bloquear a parte que depende delas.
- Commit, push, PR, merge e deploy devem respeitar o escopo autorizado na conversa. Um pedido
  de ajuste não autoriza publicar em produção. Se o usuário pedir para não commitar, mantenha
  as mudanças locais até a aprovação.
- Quando autorizados, faça commits por funcionalidade, com descrição do resultado final e
  testes relacionados. Use caminhos explícitos no staging e confira o diff antes do commit.
- Não altere serviços externos fora do escopo. Para refatorações e novas dependências, siga
  a exigência de autorização das cinco regras acima. Use o pnpm fixado em `packageManager`;
  não crie lockfiles de outro gerenciador.
- No Windows, prefira PowerShell e caminhos literais. Não presuma Bash, WSL, Python ou CLIs
  adicionais disponíveis; verifique antes de usá-los.

## Fluxo de entrega

- Novas branches de funcionalidade partem de `staging` atualizada; suas PRs têm `staging`
  como destino. Depois da CI e da validação do usuário na homologação, abra a PR de
  `staging` para `main`.
- `staging` usa o ambiente Preview da Vercel e o banco de homologação existente, separado
  de produção. `main` usa Production. Deploys automáticos ficam limitados a essas branches.
- Configure variáveis fixas de homologação no escopo Git `staging`; não reutilize segredos
  ou banco de produção em Preview. Preview de funcionalidade exige configuração isolada.
- Aprovação para criar ou atualizar homologação não autoriza merge em `main`. A promoção
  para produção exige autorização na conversa, conforme as regras acima.

## Arquitetura e limites

- `src/app/`: rotas e composição; grupos `(public)`, `(auth)` e `(admin)`.
- `src/features/`: componentes, schemas, actions e consultas por funcionalidade.
- `src/components/ui/` e `src/components/layout/`: componentes compartilhados e navegação.
- `src/lib/`: Prisma, autenticação, sessão, datas, dinheiro, armazenamento e motor de horários.
- `prisma/`: schema, migrations e seed; `tests/`: integrações e jornadas Playwright.
- Preserve a separação Server/Client Components. Prisma, segredos, bcrypt e autorização ficam
  no servidor; envie ao navegador apenas os campos necessários.
- Valide entradas com Zod e confira autorização dentro das Server Actions e handlers. O proxy
  e a ocultação de botões não substituem a validação no servidor.
- Use `requireAdmin`, `requireClient` ou `getCurrentUser` conforme o fluxo; confira vínculo ao
  negócio/agendamento, não apenas o papel da sessão ou o id recebido do cliente.
- Consulte a documentação instalada do Next antes de alterar APIs, rotas, cache ou renderização.
  `params` e `searchParams` são assíncronos; a proteção de rotas está em `src/proxy.ts`.
- Dados privados e disponibilidade não podem entrar em cache compartilhado. Páginas que dependem
  do banco em tempo de requisição não devem consultar dados de negócio durante o build;
  confira `connection()` na documentação instalada quando precisar tornar isso explícito.

## Regras do produto

- Criação e remarcação usam `bookAppointment`, com nova checagem de disponibilidade na transação.
  Preserve a proteção contra duas reservas simultâneas para o mesmo horário.
- O bloqueio ocupa duração do serviço mais reorganização: `serviceEndsAt` é o fim do atendimento,
  `endsAt` inclui `bufferMin`. Respeite expediente, pausas, exceções e políticas de cancelamento.
- Datas são persistidas em UTC e exibidas no `Business.timezone` (padrão `America/Sao_Paulo`).
  Valores monetários são inteiros em centavos; use os helpers de datas, telefone e dinheiro.
- Quem agendou sem conta pode se cadastrar diretamente com o mesmo WhatsApp, sem convite,
  preservando o id, agendamentos e histórico. Não sobrescreva contas que já possuem senha
  nem incorpore outro registro apenas por coincidência de e-mail.
- O token de gerenciamento autoriza somente o agendamento que o originou. Histórico completo
  requer sessão da cliente; um token não pode ampliar seu alcance por compartilhar o WhatsApp.
- Recuperação de senha tem link assinado válido por uma hora e uso único após a troca da senha.
  Convites opcionais valem sete dias. Preserve validação, invalidação e atualização condicional.
- WhatsApp é manual: preparar texto/link, abrir conversa ou copiar mensagem. Não anuncie envio
  concluído quando só abriu o WhatsApp, e não introduza envio automático sem pedido do usuário.
- O service worker não guarda páginas da agenda em cache: mantém ícones e fallback offline.

## Banco, segredos e serviços

- Nunca imprima ou versione tokens, senhas reais, cookies, arquivos `.env*` ou URLs de conexão.
  `.env.example` contém somente nomes e exemplos sem credenciais reais.
- Não presuma que `.env` aponta para banco local. Confirme host, banco e ambiente sem expor
  credenciais antes de migrations, seed, integração ou comandos que escrevem dados.
- `db:seed` limpa tabelas; `db:reset` apaga e recria o banco. Use apenas banco local descartável
  ou destino explicitamente autorizado. Nunca use o banco de produção para testes.
- `pnpm test` inclui integrações que carregam `.env`. Para testes sem banco use
  `pnpm exec vitest run src`; para integração escolha explicitamente um banco local isolado.
- Playwright cria/migra/semeia `E2E_DATABASE_URL`; confira que ela difere do banco de uso real.
  O servidor de teste faz build antes do global setup e normalmente usa a porta 3100.
- Prisma 7 gera o client em `src/generated/prisma`. Não edite arquivos gerados ou migrations
  já aplicadas; mudanças de schema precisam de migration revisável.
- Na Vercel, Development, Preview e Production têm variáveis separadas. Até `prisma generate`
  carrega `prisma.config.ts` e exige `DATABASE_URL` no ambiente que instala as dependências.

## Skills por tarefa

Leia somente a skill pertinente antes de aplicá-la. Os arquivos em `.agents/skills/` também
podem ser lidos diretamente se o agente não os listar automaticamente.

| Tarefa                                             | Skill local                                                                            |
| -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Agenda, clientes, autenticação e regras de negócio | [minhaagenda-domain](.agents/skills/minhaagenda-domain/SKILL.md)                       |
| Escolher testes e diagnosticar CI                  | [minhaagenda-validation](.agents/skills/minhaagenda-validation/SKILL.md)               |
| UI, acessibilidade e responsividade                | [web-design-guidelines](.agents/skills/web-design-guidelines/SKILL.md)                 |
| Performance de React/Next e consultas              | [vercel-react-best-practices](.agents/skills/vercel-react-best-practices/SKILL.md)     |
| APIs e composição de componentes                   | [vercel-composition-patterns](.agents/skills/vercel-composition-patterns/SKILL.md)     |
| Animações e transições solicitadas                 | [vercel-react-view-transitions](.agents/skills/vercel-react-view-transitions/SKILL.md) |
| Textos da interface e documentação                 | [writing-guidelines](.agents/skills/writing-guidelines/SKILL.md)                       |
| Extrair um design de referência solicitado         | [skillui](.agents/skills/skillui/SKILL.md)                                             |
| Deploy, variáveis, logs e falhas da Vercel         | [deploy-to-vercel](.agents/skills/deploy-to-vercel/SKILL.md)                           |
| Retrospectiva e melhoria das instruções            | [task-observer](.agents/skills/task-observer/SKILL.md)                                 |

## Entrega e validação

Sempre execute os checks da CI conforme a segunda regra e a skill de validação:
`pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` e `pnpm test:e2e`.
Prepare banco local isolado antes das integrações; o Playwright inclui o build de produção.
Execute `pnpm build` separadamente quando necessário para diagnosticar o build.
Inspeção visual e validação de skills complementam esses checks, sem substituí-los.
Não crie testes que apenas espelhem texto ou classes CSS.

No resumo, diferencie checks locais, CI e deploy; só afirme que passaram depois de observar
o resultado. Registre o comando/ambiente e qualquer etapa não executada ou bloqueada.
