import "server-only"

/*
 * Envio de mensagens (lembretes por e-mail). Interface única com duas
 * implementações: Resend em produção (RESEND_API_KEY) e um "notificador de
 * console" em desenvolvimento, que só registra no log e devolve sucesso,
 * para o fluxo de lembretes ser testável sem chave.
 *
 * WhatsApp não tem envio automático ainda (provedor a definir, ver
 * docs/PLANO.md §8): o painel mostra um link wa.me com o texto pronto.
 */

export type EmailMessage = {
  to: string
  subject: string
  text: string
  html: string
}

export interface EmailNotifier {
  readonly name: string
  send(message: EmailMessage): Promise<void>
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

const RESEND_ENDPOINT = "https://api.resend.com/emails"

class ResendNotifier implements EmailNotifier {
  readonly name = "resend"
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`)
    }
  }
}

class ConsoleNotifier implements EmailNotifier {
  readonly name = "console"
  async send(message: EmailMessage): Promise<void> {
    console.info(`[e-mail simulado] para ${message.to} · ${message.subject}\n${message.text}`)
  }
}

/* Remetente padrão do Resend para testes; em produção configure EMAIL_FROM com domínio verificado. */
const DEFAULT_FROM = "MinhaAgenda <onboarding@resend.dev>"

export function createEmailNotifier(): EmailNotifier {
  const key = process.env.RESEND_API_KEY
  if (key) return new ResendNotifier(key, process.env.EMAIL_FROM || DEFAULT_FROM)
  return new ConsoleNotifier()
}

/* URL pública da aplicação, para os links das mensagens. */
export function appBaseUrl(): string {
  return (process.env.AUTH_URL || "http://localhost:3000").replace(/\/+$/, "")
}
