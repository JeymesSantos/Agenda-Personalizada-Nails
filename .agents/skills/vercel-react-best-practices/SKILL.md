---
name: vercel-react-best-practices
description: Implementar ou otimizar componentes, carregamento de dados e desempenho React/Next do MinhaAgenda. Use em alterações de renderização, consultas, bundle ou lentidão; não iniciar auditoria de custos Vercel sem relação com a tarefa.
license: MIT
metadata:
  adapted-from: vercel/react-best-practices
---

# React e Next do projeto

Confira versões em `package.json` e a documentação pertinente em `node_modules/next/dist/docs/`.
Este repositório usa App Router, React 19, Server Actions, Prisma e `cacheComponents: false`;
não transfira exemplos de outra versão ou framework sem conferir compatibilidade.

## Prioridade de implementação

- Mantenha páginas/consultas no servidor e limite `use client` aos componentes com interação,
  estado ou APIs do navegador. Não mova uma árvore inteira para o cliente por causa de um botão.
- Valide sessão e escopo antes de acessar dados privados. Paralelize apenas consultas
  independentes que já estejam autorizadas; não antecipe leitura sensível antes da autorização.
- Use `select`, filtros e limites adequados em Prisma. Evite N+1 e duplicação de consultas
  sem alterar os vínculos e a ordenação esperada pelo produto.
- Uma consulta Prisma não torna uma página necessariamente dinâmica. Quando os dados só
  devem ser obtidos na requisição, use a API documentada do Next, como `connection()`, antes
  da leitura. O build deve funcionar sem consultar tabelas que dependem do setup de testes.
- Não compartilhe cache de sessões, tokens, dados privados ou disponibilidade entre usuários.
  Deduplique por requisição se necessário; cache persistente exige escopo e invalidação claros.
- Derive valores simples no render; não use effect para sincronizar estado que pode ser
  calculado. Use `useActionState` e `useTransition` conforme os formulários existentes.
- Não introduza `memo`, `useMemo`, `useCallback`, context global ou biblioteca de dados sem
  evidência de custo ou necessidade. Evite componentes declarados dentro de outros quando
  isso provocar remount e perda de estado.
- Adie gráficos, editores ou mídias pesadas quando houver benefício demonstrável. Preserve
  os formatos, foco e posterior carregamento das imagens/vídeos já suportados pelo app.
- Não adicione dependências de animação, SWR ou cache apenas porque constam em uma referência.

## Investigações de desempenho

Reproduza o problema e registre rota, volume de dados e medida antes/depois. Diferencie
tempo de consulta, renderização, assets e cold start. Para custos da Vercel, use métricas do
projeto e período corretos se disponíveis; sem métricas, apresente hipótese, não economia
comprovada. Não execute scanners ou scripts externos que não existem neste repositório.

Valide o comportamento com a skill `minhaagenda-validation`, dando atenção a autorização,
dados atualizados, hidratação e build de produção.
