---
name: deploy-to-vercel
description: Diagnosticar ou executar deploys, previews, variáveis de ambiente e logs da Vercel para o MinhaAgenda. Use em falhas de implantação ou pedidos de publicar; respeite ambiente e autorização já definidos na conversa.
metadata:
  adapted-from: deploy-to-vercel e vercel-cli-with-tokens
---

# Vercel do MinhaAgenda

Antes de agir, leia `AGENTS.md`, `package.json`, `prisma.config.ts`, `vercel.json` e o ambiente
pretendido. Inspecione branch/remote e, se existir, `.vercel/project.json` ou `.vercel/repo.json`.
Não presuma que o nome da pasta corresponde ao projeto Vercel ou que o time ativo é o correto.

## Diagnosticar antes de alterar

- Consulte o check e os logs do deployment/commit correto. `gh pr checks <numero>` e
  `vercel inspect <deployment> --logs` ajudam a localizar a primeira falha relevante.
- Separe instalação, Prisma, build, startup, CI e erro em runtime. Aprovação no GitHub
  Actions não significa que a preview tenha variáveis ou banco configurados.
- `postinstall` executa `prisma generate`; `prisma.config.ts` exige `DATABASE_URL` já nessa
  etapa. Não resolva variável ausente removendo validação ou usando URL de produção na preview.
- `build:vercel` executa migrations antes do build. Confira o comando configurado no projeto
  e o banco de destino; uma implantação pode aplicar migrations, não apenas compilar arquivos.
- Preview, Development e Production têm variáveis independentes. Confira presença e escopo
  de `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AUTH_SECRET`, `AUTH_URL` e integrações necessárias
  sem imprimir seus valores. Banco de preview precisa ser isolado do de produção.
- Páginas dependentes do banco em tempo de requisição devem evitar consultas durante build;
  consulte a documentação instalada do Next e a skill `minhaagenda-validation`.

## Credenciais e destino

Use a sessão autenticada disponível (`vercel whoami`) ou o mecanismo de credenciais seguro
suportado pela versão instalada (`vercel --help`). Não imprima tokens com `printenv`, grep
em `.env` ou comandos equivalentes. Não coloque segredo literal em argumentos, histórico,
logs, corpo de PR ou arquivo versionado. Não peça que o usuário cole tokens no chat.

Não use `vercel link` para descobrir o destino: é uma mutação. Se vínculo/escopo forem
ambíguos e impedirem a tarefa, peça apenas a informação ausente. Não recrie o projeto,
ative serviços pagos ou substitua um deployment com projeto temporário sem pedido específico.

## Executar quando autorizado

- Priorize o fluxo Git já conectado. Push dispara preview na branch e pode disparar produção
  na branch de produção; confirme destino e diff antes de usar a autorização existente.
- Pedido para abrir PR inclui o push necessário da branch. Não peça autorização de novo
  para esse passo; isso não autoriza merge nem publicação em produção.
- Para deploy por CLI solicitado, use preview por padrão; produção requer escopo explícito.
  Não instale/atualize o CLI globalmente apenas para inspecionar um log.
- Alteração de variável exige ambiente e valor corretos obtidos por canal seguro. Não copie
  segredos de produção para Preview nem rode seed na nuvem como preparo genérico.
- Após enviar, observe status e logs. Uma URL retornada não comprova sucesso. Faça verificação
  de leitura do endpoint afetado quando pertinente e autorizada, sem acionar envios ou reservas.

Entregue URL, commit/ambiente, checks observados e pendências externas concretas. Se rede
ou sandbox bloquear um comando necessário, use o mecanismo de aprovação da sessão; não
contorne a restrição com outra ferramenta ou expondo credenciais.
