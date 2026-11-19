import { dispatchDueReminders } from "@/features/reminders/core"

/*
 * Cancelamento dos lembretes de e-mail antigos. Na Vercel roda pelo Cron (vercel.json,
 * diariamente às 09:00 UTC / 06:00 em São Paulo), que manda
 * `Authorization: Bearer ${CRON_SECRET}`. O plano Hobby pode executar dentro dessa hora.
 * Fora da Vercel, chame com o mesmo cabeçalho. Sem CRON_SECRET definido (dev) a rota
 * fica aberta, para testar com um GET simples.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Não autorizado." }, { status: 401 })
  }
  const result = await dispatchDueReminders()
  return Response.json({ ok: true, ...result })
}
