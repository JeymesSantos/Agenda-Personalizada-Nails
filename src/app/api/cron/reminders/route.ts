import { dispatchDueReminders } from "@/features/reminders/core"

/*
 * Disparo dos lembretes vencidos. Na Vercel roda pelo Cron (vercel.json, a
 * cada 15 min), que manda `Authorization: Bearer ${CRON_SECRET}`. Fora da
 * Vercel, chame com o mesmo cabeçalho. Sem CRON_SECRET definido (dev) a rota
 * fica aberta, para testar com um GET simples.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Não autorizado." }, { status: 401 })
  }
  const result = await dispatchDueReminders(new Date())
  return Response.json({ ok: true, ...result })
}
