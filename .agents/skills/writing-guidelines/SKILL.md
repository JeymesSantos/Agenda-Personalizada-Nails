---
name: writing-guidelines
description: Escrever ou revisar textos da interface, mensagens manuais de WhatsApp, README e documentação do MinhaAgenda em português claro e coerente com o comportamento atual. Use em mudanças de texto ou documentação.
metadata:
  adapted-from: vercel-labs/writing-guidelines
---

# Escrita do MinhaAgenda

Escreva em português brasileiro, com ação e consequência claras. Preserve o vocabulário da
tela e da marca: cliente, profissional, studio, agendamento, horários, serviço e reorganização.
Não mude nomenclatura em todo o produto por preferência editorial.

## Interface e mensagens

- Botões devem dizer a ação real: salvar contato atualiza nome/WhatsApp no sistema; abrir
  WhatsApp prepara a conversa; copiar mensagem só copia. Não diga que a mensagem foi enviada.
- Erros devem orientar o próximo passo sem expor detalhes internos, segredos ou dados de outra
  pessoa. Evite mensagens genéricas quando há uma correção concreta possível no campo.
- Cadastro sem conta anterior usa o mesmo WhatsApp sem convite. Convites são opcionais;
  textos de ajuda não podem contradizer essa regra.
- Recuperação deve explicar solicitação manual ao studio, validade e uso do link. Não inclua
  senha em texto puro nas mensagens e não peça que a cliente a envie pelo WhatsApp.
- Mensagens para envio manual devem preservar destinatário, link correto, validade e contexto.
  Use quebras de linha legíveis e a normalização de telefone existente para links `wa.me`.
- Datas, moeda e telefone usam helpers do projeto; pluralize quantidades e trate ausência de
  informação. Evite texto técnico em fluxos de cliente ou profissional.

## Documentação e PRs

Confira o código/comandos antes de documentar. Explique o estado final, ambiente e efeito dos
comandos que escrevem dados. Exemplos não devem conter credenciais reais nem instruir seed
em produção. Atualize documentação contraditória quando o comportamento tiver mudado.

PRs descrevem o problema, o resultado e a validação observada. Não anuncie CI ou deploy
concluídos sem verificar. Prefira texto curto e links locais relativos na documentação.

Uma revisão editorial solicitada pode consultar
https://github.com/vercel-labs/writing-guidelines. Não dependa de download obrigatório a cada
edição, nem deixe uma referência externa mudar o produto ou o escopo pedido.
