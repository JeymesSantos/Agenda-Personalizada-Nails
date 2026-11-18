---
name: task-observer
description: Revisar falhas recorrentes e melhorar instruções ou skills locais do MinhaAgenda quando o usuário pedir retrospectiva ou ajustes no fluxo de trabalho. Não executar como hook de início de sessão, monitor permanente ou coleta automática de conversas.
metadata:
  inspired-by: Eoghan Henn e contribuidores — rebelytics/one-skill-to-rule-them-all (CC-BY-4.0)
---

# Retrospectiva das instruções

Esta é uma adaptação reduzida para o repositório, inspirada no Task Observer de Eoghan Henn
e contribuidores, https://github.com/rebelytics/one-skill-to-rule-them-all (CC-BY-4.0).
Ela não instala hooks, scripts Bash, coleta de telemetria ou diretórios globais de memória.

Quando o usuário pedir melhoria das instruções ou análise de problemas repetidos:

1. Leia o `AGENTS.md` e a skill relacionada ao problema, apenas no escopo necessário.
2. Identifique o comportamento esperado, evidência observada e causa. Diferencie erro de
   instrução, configuração do ambiente, decisão do produto e falha pontual de execução.
3. Proponha a menor mudança que evite a recorrência. Coloque uma regra de produto no domínio,
   um procedimento especializado na skill pertinente e uma orientação geral no `AGENTS.md`.
4. Se já houver autorização para aplicar, edite os arquivos e valide o resultado; não peça
   aprovação novamente. Sem essa autorização, entregue a proposta sem autoalterar as regras.
5. Confira referências, descrições de ativação, segurança e compatibilidade com Windows.
   Remova instruções obsoletas em vez de acumular exceções contraditórias.

Não transforme preferência ocasional em regra permanente, não reabra decisões aprovadas e
não conclua que todo problema exige nova skill. Não copie transcrições, dados pessoais,
segredos ou logs brutos para documentação. Não crie cron, agente paralelo ou rotina semanal
sem pedido explícito. Reporte quais instruções mudaram e por que são pertinentes ao projeto.
