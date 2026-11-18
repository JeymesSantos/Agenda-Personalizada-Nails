---
name: vercel-react-view-transitions
description: Implementar animações e transições solicitadas no MinhaAgenda, verificando compatibilidade de React/Next e acessibilidade. Use para navegação animada, entrada e saída, elementos compartilhados ou reordenação; não adicionar animações a ajustes sem relação.
license: MIT
metadata:
  adapted-from: vercel/react-view-transitions
---

# Movimento e transições

Defina qual mudança a animação comunica e em que interação deve ocorrer. Consulte o código
existente, as versões/tipos instalados e a documentação do Next antes de usar `ViewTransition`,
`addTransitionType`, `transitionTypes` ou flags experimentais. A referência de outro projeto
não comprova que uma API esteja disponível neste build.

- Prefira CSS/Tailwind existente para hover, feedback e pequenas entradas. Use transições de
  view apenas quando trouxerem continuidade útil entre estados ou rotas.
- Não instale React canary, atualize framework ou habilite recurso experimental silenciosamente.
  Se a solução depender disso, apresente a dependência e uma alternativa compatível.
- Mantenha navegação, formulário, foco e scroll funcionando sem suporte à animação. Não
  bloqueie confirmação de agendamento ou atualização de disponibilidade esperando movimento.
- Respeite `prefers-reduced-motion`. Evite deslocamentos extensos, animações contínuas de
  fundo adicionais e efeitos que dificultam leitura sobre as mídias existentes.
- Nomes de elementos compartilhados devem ser únicos por árvore; dialogs e páginas podem
  conter o mesmo componente simultaneamente. Preserve identidade da lista com ids reais.
- Confira voltar/avançar, refresh, carregamento e erro; transições que dependem de tipos
  explícitos podem não receber esses tipos ao voltar pelo navegador.
- Não anime dados privados por meio de cache compartilhado ou snapshots persistentes.

Valide no navegador com e sem movimento reduzido e conclua `pnpm typecheck`/build quando
usar APIs do framework. A skill não exige implementar todos os padrões de animação de uma vez.
