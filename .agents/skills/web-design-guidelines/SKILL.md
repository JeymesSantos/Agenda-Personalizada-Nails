---
name: web-design-guidelines
description: Ajustar ou revisar UI, acessibilidade e responsividade do MinhaAgenda em celular, tablet e desktop, preservando os tokens e componentes existentes. Use em telas, formulários, listas, navegação e problemas visuais.
metadata:
  adapted-from: vercel-labs/web-interface-guidelines
---

# Interface e responsividade

Use `docs/design-tokens.md`, `src/app/globals.css`, `src/components/ui/` e telas equivalentes
como referência. O projeto tem tema escuro, magenta/rosa e fontes já definidas. Não substitua
o sistema visual por um kit novo nem extraia outro design para corrigir uma tela existente.

## Ajustar o layout

- Comece pela largura pequena. Use grids/flex com `min-w-0`, colunas flexíveis, quebra de
  texto e elementos fixos com `shrink-0` quando necessário. Não esconda overflow globalmente
  para disfarçar conteúdo que ultrapassa a tela.
- Nome, telefone, datas, preços, badges e ações devem continuar legíveis. Distribua informações
  em linhas ou cards no celular; não corte dados essenciais para manter uma única linha.
- Preserve sidebar no desktop, barra inferior no celular, safe area e espaço para conteúdo
  não ficar inacessível sob a navegação fixa. Confira também a área útil depois da sidebar.
- Teste nomes longos, lista vazia, mensagem de erro, pendência, valores monetários altos e
  formulários com teclado. Não presuma que dados curtos do seed representam todos os casos.
- Componentes interativos precisam de nome acessível, foco visível e operação por teclado.
  Use botão para ação, link para navegação e rótulos associados aos campos. Mantenha o
  comportamento de foco de dialogs/sheets do Radix; não aninhe controles interativos.
- Preserve tamanho legível dos inputs no celular e contraste sobre fotos/vídeos com véu.
  Cor sozinha não deve transmitir status; texto e estados de erro devem ser compreensíveis.
- Prefira ícones Lucide e componentes já existentes, incluindo estados disabled/pending.

## Conferir o resultado

Inspecione a tela alterada no navegador em larguras pertinentes; 320/390, 768 e 1440 px são
boas referências. Para bugs entre breakpoints, inclua a largura relatada, como 1062 px.
Confira rolagem horizontal, sobreposição, legibilidade, foco e se as ações ainda funcionam.

Capture screenshots locais para comparar e revise as imagens. Para ajuste visual simples,
não crie testes que apenas confirmam classes ou texto estático. Use `minhaagenda-validation`
quando houver mudança funcional junto do layout.

Uma auditoria solicitada pode consultar as diretrizes atuais de
https://github.com/vercel-labs/web-interface-guidelines; a rede não é pré-requisito para uma
correção local. Relate achados com arquivo, impacto e correção concreta, sem impor redesign.
