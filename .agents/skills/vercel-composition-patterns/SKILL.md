---
name: vercel-composition-patterns
description: Refatorar APIs de componentes e composição React do MinhaAgenda quando houver duplicação relevante, estados compartilhados ou muitas combinações de props. Não usar para transformar uma correção pequena em reestruturação da UI.
license: MIT
metadata:
  adapted-from: vercel/composition-patterns
---

# Composição de componentes

Inspecione o componente e seus consumidores antes de alterar a API. Reutilize as convenções
de `src/components/ui/` e `src/components/layout/`; componentes exclusivos de uma área ficam
em `src/features/<feature>/components/`.

- Prefira composição com `children`, slots e variantes claras às combinações de flags que
  permitem estados contraditórios. Props booleanas simples e válidas não exigem refatoração.
- Use compound components/context quando existirem partes que precisam compartilhar estado
  e ciclo de vida; não crie providers apenas para eliminar uma prop.
- Mantenha estado no menor ancestral que realmente o compartilha. Preserve chaves estáveis,
  foco, inputs não controlados e estado de dialogs ao reorganizar a árvore.
- Separe apresentação de acesso ao banco e ações. Não importe módulos de servidor em
  componentes de cliente nem serialize callbacks comuns entre fronteiras Server/Client.
- Em React 19, confira os tipos instalados antes de mudar refs e APIs de contexto. Não
  substitua `useContext` ou `forwardRef` em massa por preferência de estilo.
- Preserve as APIs e os atributos de acessibilidade do Radix/shadcn, incluindo `asChild`,
  associação de labels, teclas e foco. Evite links envolvendo outros links/botões.
- Ajuste somente consumidores afetados e explique por que a nova composição reduz um
  problema concreto. Não crie um design system paralelo.

Para mudança de comportamento, selecione os checks em `minhaagenda-validation`; para
impacto visual, use também `web-design-guidelines`.
