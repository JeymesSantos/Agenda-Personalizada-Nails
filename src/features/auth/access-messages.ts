import { normalizeWhatsapp } from "@/lib/phone"

export function accessWhatsappLink(whatsapp: string, message: string) {
  return `https://wa.me/55${normalizeWhatsapp(whatsapp)}?text=${encodeURIComponent(message)}`
}

export function accessRequestMessage(kind: "registration" | "reset") {
  return kind === "reset"
    ? "Olá! Esqueci minha senha e gostaria de receber um link para recuperar o acesso à minha conta."
    : "Olá! Já fiz um agendamento sem cadastro e gostaria de receber um convite para criar minha conta e acessar meus horários."
}

export function accessDeliveryMessage(name: string, business: string, url: string, reset: boolean) {
  return reset
    ? `Olá, ${name}! Aqui é do ${business}.\n\nUse este link para definir uma nova senha:\n${url}\n\nO link é válido por 1 hora e só pode ser usado uma vez. Não compartilhe com outras pessoas. Se não pediu a recuperação, ignore esta mensagem.`
    : `Olá, ${name}! Aqui é do ${business}.\n\nCrie sua conta pelo link abaixo usando o mesmo WhatsApp informado no agendamento. Seus horários e histórico serão mantidos:\n${url}\n\nO convite é válido por 7 dias e só pode ser usado uma vez. Não compartilhe com outras pessoas.`
}
