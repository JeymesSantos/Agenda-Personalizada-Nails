---
name: minhaagenda-domain
description: Alterar agenda, cadastro, autenticação, clientes e lembretes do MinhaAgenda preservando disponibilidade, histórico e limites de acesso. Use em mudanças das regras de negócio ou de persistência desses fluxos.
---

# Domínio do MinhaAgenda

Leia o `AGENTS.md` da raiz e os arquivos da funcionalidade afetada. Confirme o estado atual no
código: documentos de planejamento não substituem decisões recentes do usuário.

## Rotas de investigação

| Alteração                              | Arquivos centrais                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| Disponibilidade, reserva e remarcação  | `src/features/booking/core.ts`, `src/lib/scheduling/`, `src/features/agenda/`                 |
| Cadastro, login, convite e recuperação | `src/features/auth/`, `src/lib/auth.ts`, `src/lib/session.ts`, `src/proxy.ts`                 |
| Acesso com sessão ou token             | `src/features/client-area/queries.ts`, `src/features/client-area/actions.ts`                  |
| Perfil e contato da cliente            | `src/features/clients/`, `src/app/(admin)/admin/clientes/`                                    |
| Lembretes e mensagens                  | `src/features/reminders/`, `src/lib/notifications.ts`, `src/features/auth/access-messages.ts` |
| Persistência e vínculos                | `prisma/schema.prisma`, `prisma/migrations/`                                                  |

## Implementação

- Preserve `bookAppointment` como caminho comum de reserva e remarcação. Confira conflitos
  dentro da transação, com os status ativos definidos no código; não se limite aos slots da UI.
- Diferencie fim do serviço de fim do bloqueio; use duração e reorganização em minutos.
  Mantenha fuso do negócio, centavos, exceções e prazo de cancelamento configurável.
- No cadastro direto, localize o WhatsApp normalizado. Só incorpore `CLIENT` com
  `passwordHash: null`, preservando o id. A atualização deve continuar condicionada ao estado
  consultado para impedir sobrescrita por cadastros simultâneos.
- Um e-mail usado por outro registro continua sendo conflito. Um número com conta ativa exige
  login ou recuperação. Convite é opcional; não volte a exigi-lo no cadastro comum.
- Em cada mutação autenticada, confira papel e acesso ao recurso. Nos acessos por token,
  limite consulta e mutação ao agendamento autorizado, mesmo que existam outros do mesmo número.
- Não envie hash de senha, tokens alheios ou notas privadas em props de Client Components.
- Recuperação é assinada, expira em uma hora, vincula o contato e o hash atual, e usa troca
  condicional da senha. Convite expira em sete dias e não funciona após a ativação da conta.
- Mudanças de status e remarcações devem manter lembretes coerentes com a reserva atual.
  WhatsApp continua manual; o notificador de console de e-mail não comprova entrega real.

Para validar mudanças nessas regras, use a skill local `minhaagenda-validation` e selecione
os testes relevantes de `tests/integration/`, `tests/e2e/` e `src/lib/scheduling/`.
