---
name: minhaagenda-validation
description: Executar todos os checks da CI antes de concluir qualquer tarefa do MinhaAgenda e diagnosticar falhas de lint, formatação, tipos, build, Vitest ou Playwright, incluindo alterações de documentação e estilo.
---

# Validação e CI

Leia `package.json`, `vitest.config.mts`, `playwright.config.ts`, `tests/e2e/env.ts` e o workflow
da CI conforme o problema. Use o log da execução e do commit corretos, não apenas a última
mensagem de erro. Não afirme que o código passou porque o processo apenas iniciou.

## Validação obrigatória antes da conclusão

Siga as cinco regras do `AGENTS.md` para todos os agentes. Sempre execute os checks atuais
de `.github/workflows/ci.yml`: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`
e `pnpm test:e2e`. O Playwright inclui build e start da aplicação. Prepare o banco local
isolado antes das integrações, sem alterar configurações de uso real para fazer os testes
passarem. Não execute seed ou reset contra um banco de produção.

Isso também se aplica a mudanças de documentação, instruções, skills ou estilo. Os checks
focados abaixo ajudam no diagnóstico, mas não substituem os checks completos da CI.

Se não conseguir executar algum check, pare e avise o usuário, explicando o bloqueio e os
resultados já obtidos. Não declare a tarefa concluída, não remova asserções ou funcionalidades
prontas e não instale dependências sem autorização para contornar a falha.

## Validações complementares por mudança

| Mudança                        | Validação adequada                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| Documentação e skills          | Prettier dos arquivos, links locais, frontmatter e coerência                                    |
| Layout simples                 | ESLint dos arquivos, navegador e inspeção em larguras relevantes; sem testes de classes CSS     |
| Código TypeScript ou contratos | `pnpm typecheck` e lint pertinentes                                                             |
| Função pura de negócio         | Teste Vitest da função ou `pnpm exec vitest run src`                                            |
| Persistência e concorrência    | Integração correspondente em banco local isolado                                                |
| Cadastro, sessão ou jornada    | Playwright dos cenários afetados, incluindo persistência e nova sessão quando relevante         |
| Renderização e build           | `pnpm build`; valide também sem banco existente se a mudança pretende evitar consultas no build |

Apresente ao usuário os comandos e os resultados da execução atual, incluindo quantidades
de testes quando disponíveis. Diferencie aprovação local, CI remota e deploy. Uma execução
remota anterior às mudanças não valida a versão atual da tarefa.

## Banco de testes

`pnpm test` carrega `.env` nas integrações e pode escrever dados. Não o execute sem verificar
o destino. O seed limpa tabelas e o global setup do Playwright também semeia o banco escolhido.

Exemplo PowerShell com o Postgres local do `docker-compose.yml`, em banco descartável:

```powershell
$env:DATABASE_URL = 'postgresql://minhaagenda:minhaagenda@localhost:5432/minhaagenda_test?schema=public'
$env:DATABASE_URL_UNPOOLED = $env:DATABASE_URL
$env:E2E_DATABASE_URL = $env:DATABASE_URL
pnpm test:e2e tests/e2e/account-access.spec.ts tests/e2e/manual-access.spec.ts
```

Essas credenciais são apenas as do Docker local. O Playwright cria o banco, aplica migrations
e executa o seed; confira o host e o nome antes. Para integrações sem Playwright, prepare o
banco isolado com migrations e seed antes de `pnpm test`. Não rode duas suítes que semeiam
ou limpam o mesmo banco simultaneamente. Variáveis definidas na sessão precisam ser restauradas
antes de executar comandos em outro ambiente.

## Diagnóstico de falhas

- `config.webServer ... Exit code: 1`: leia as linhas anteriores do build/start. O build
  antecede o global setup; o banco e2e pode ainda não existir. Páginas de dados atuais devem
  aguardar requisição; consulte `connection()` na documentação do Next instalada.
- Falha de instalação da Vercel em `prisma generate`: confira a presença de `DATABASE_URL`
  no ambiente Preview/Production correspondente; não use credenciais falsas para mascarar isso.
- Falha de locator/login: confira o texto real do botão, URL e sessão. Use contexto novo para
  provar um novo login, e seletores por papel/rótulo em vez de dependência de classes.
- Falha intermitente de desempenho: confirme isoladamente sem outras tarefas pesadas antes
  de concluir regressão. Não relaxe timeout ou remova uma asserção só para deixar a CI verde.
- Use screenshots e trace do Playwright para investigar; não versionar relatórios ou seeds reais.

Em PRs, consulte `gh pr checks` e o run correto. Diferencie CI aprovada, preview pronta e
configuração externa pendente; são resultados distintos.
