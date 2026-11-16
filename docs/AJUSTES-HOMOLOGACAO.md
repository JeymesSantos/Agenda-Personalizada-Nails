# Ajustes da homologação — 16/11/2026

Branch: `fix/ajustes-homologacao-agenda`.

- Fundos: enquadramento independente para computador (a partir de 1024 px) e celular,
  para fotos e vídeos. O crossfade mantém a posição salva, sem zoom que altere o corte.
- Serviços: cada foto tem seu próprio botão de enquadramento. O ajuste é salvo com
  o serviço e aplicado no catálogo público, na lista e na prévia do cadastro.
- Fundos por página: remover a última mídia deixa apenas aquela página sem fundo.
  “Voltar ao padrão” restaura a herança da área. A biblioteca e as outras páginas são preservadas.
- Disponibilidade: botão “Fechar” leva à agenda. O almoço tem controles explícitos
  por dia para ativar, alterar ou remover a pausa.
- Agenda: faixas de fundo são recortadas pela prioridade usada na disponibilidade:
  bloqueios prevalecem sobre liberações, e liberações prevalecem sobre o almoço.
  Agendamentos têm sua própria faixa visual. Textos ficam limitados à altura do intervalo.
  Reabrir um agendamento cancelado ou com falta refaz a verificação de disponibilidade
  em transação serializável, impedindo ocupar um horário já reservado.
- Telefone: campos de contato reconhecem DDD e aceitam o prefixo internacional +55.
  A gravação usa o número nacional com DDD; o sistema não adivinha um DDD ausente.
- Avisos: cancelamento, remarcação e falta registram uma mensagem persistente no
  agendamento, visível no painel, em “Meus horários” e no comprovante autorizado.
  São avisos no aplicativo, sem envio automático de e-mail ou WhatsApp.

O item isolado “Remover” foi desconsiderado, conforme a correção do usuário.

## Banco e implantação

A migração `20261116190000_media_framing` adiciona os campos de enquadramento,
o controle de herança por página e a tabela de avisos. Não remove dados existentes.
Foi aplicada ao banco de desenvolvimento Neon; produção recebe a migração pelo
`prisma migrate deploy` quando o deploy for realizado.

Os testes usam um banco PostgreSQL local separado. O seed de demonstração não deve
ser executado no banco de desenvolvimento Neon ou em produção.

## Validação

Os testes de regressão cobrem normalização de telefone, validação da pausa,
precedência das faixas da agenda, persistência do enquadramento e dos avisos,
remoção/restauração do fundo por página e conflito ao reabrir um horário ocupado.
Os testes de navegador verificam os fluxos em larguras de 390 e 1440 px.

Antes da publicação, validar os ajustes com o usuário e escolher se haverá também
envio dos avisos por e-mail. A configuração da Vercel continua sendo uma etapa posterior.
