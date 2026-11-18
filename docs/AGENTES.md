# Agentes e skills do MinhaAgenda

As instruções gerais ficam em [AGENTS.md](../AGENTS.md). Os procedimentos especializados
ficam em `.agents/skills/<nome>/SKILL.md`, com frontmatter `name` e `description` para
descoberta por agentes compatíveis. Não há alteração de configuração global da máquina.

## Uso

Leia o `AGENTS.md` ao entrar no projeto. Escolha as skills relacionadas à tarefa; não carregue
todo o catálogo em cada conversa. É possível invocar pelo nome (por exemplo,
`$minhaagenda-validation`) quando o cliente suportar skills locais, ou pedir ao agente para
ler o caminho do `SKILL.md`. Se o catálogo da sessão já foi carregado, uma nova sessão pode
ser necessária para listar as novas skills; os arquivos continuam disponíveis para leitura.

As skills não concedem permissão adicional para publicar, acessar contas, alterar dados
reais ou instalar ferramentas. A autorização da conversa e as permissões do ambiente
continuam valendo. Não é necessário repetir uma confirmação que o usuário já concedeu.

As cinco regras obrigatórias do `AGENTS.md` se aplicam a todos os agentes: parar e avisar
quando não conseguir executar, preservar o que já funciona, executar e mostrar todos os checks
da CI, limitar as mudanças ao necessário, exigir autorização para refatorações/dependências
e impedir publicação de configurações locais ou valores de ambiente. Nenhuma skill pode
dispensar essas regras.

## Adaptação das referências

Base de referência fornecida pelo usuário: diretório `.agents` do projeto
`conectando-oportunidades`. Os materiais foram usados como referência e reescritos para
Next.js/App Router, React 19, Tailwind v4, Prisma 7, PostgreSQL, Auth.js e a operação deste PWA.
O projeto de origem não foi modificado. Não existe dependência de seu caminho absoluto.

| Referência                                    | Aplicação neste projeto                                                                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `web-design-guidelines`                       | Revisão local com tokens do studio, acessibilidade, cards e navegação responsiva; diretriz externa opcional                                     |
| `vercel-react-best-practices`                 | Server/Client Components, consultas Prisma, autorização, dados atuais e build sem leitura antecipada de negócio                                 |
| `vercel-composition-patterns`                 | Composição do kit Radix/shadcn e componentes das features, sem refatoração obrigatória de toda a UI                                             |
| `vercel-react-view-transitions`               | Somente em tarefas de movimento, com verificação das APIs instaladas e redução de movimento                                                     |
| `writing-guidelines`                          | Português brasileiro, textos coerentes com cadastro direto e envios manuais, README e PRs                                                       |
| `skillui`                                     | Extração somente para referência solicitada; os tokens locais continuam sendo a fonte padrão                                                    |
| `deploy-to-vercel` e `vercel-cli-with-tokens` | Consolidados em `deploy-to-vercel`, sem exposição de credenciais ou dependência de uma forma de autenticação não verificada                     |
| `vercel-optimize`                             | Princípio de medir antes de otimizar incorporado em `vercel-react-best-practices`; não copiados coletores, scripts e exigências de planos pagos |
| `task-observer`                               | Retrospectiva sob demanda; sem hooks, memória global, automação semanal ou dependência de Claude/Bash                                           |
| `vercel-react-native-skills`                  | Não instalada: este projeto é um web app/PWA, sem React Native, Expo ou módulos nativos                                                         |
| Sem equivalente na referência                 | `minhaagenda-domain` para agenda, contas e mensagens; `minhaagenda-validation` para banco isolado, checks e CI                                  |

As adaptações mantêm os nomes das skills de referência quando o propósito permanece o mesmo.
Não foram copiados catálogos inteiros de regras, scripts auxiliares ou links locais para arquivos
que não existem aqui. Os metadados dos guias React preservam a indicação MIT da referência;
o Task Observer tem sua inspiração e licença original identificadas na própria adaptação.

## Onde atualizar cada decisão

- Regra geral de trabalho, arquitetura e autorização: `AGENTS.md`.
- Regra de negócio: código/testes e `minhaagenda-domain`; mantenha o README coerente.
- Fluxo de testes e segurança do banco: `minhaagenda-validation` e configurações reais da CI.
- Identidade visual: `docs/design-tokens.md`, `src/app/globals.css` e componentes, usando
  `web-design-guidelines` para implementação e conferência.
- Procedimento de deploy/ambientes: `deploy-to-vercel`; valores de segredos ficam fora do Git.

Não grave status transitório de uma execução, URLs com token ou credenciais nos arquivos de
instrução. Problemas de configuração devem ser diagnosticados no ambiente correto, sem
transformar cada ocorrência em uma proibição geral para trabalhos futuros.

## Manutenção e validação

Para editar uma skill, use `skill-creator` quando estiver disponível. Confira nome/descrição,
escopo de ativação, links locais, exemplos e comandos, além da formatação dos arquivos.
Execute o `quick_validate.py` fornecido por essa skill quando disponível; ele verifica a
estrutura, não a qualidade das decisões. Essas verificações complementam os checks completos
da CI, obrigatórios também para mudanças exclusivamente nestas instruções. Quando algum
check estiver bloqueado, informe os resultados obtidos e a validação pendente ao usuário.

O bloco `nextjs-agent-rules` da raiz é mantido pelo Next.js. Preserve-o junto das instruções
do projeto; os guias instalados em `node_modules/next/dist/docs/` prevalecem sobre exemplos
genéricos de APIs do framework.
