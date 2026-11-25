"use client"

import { useInstall } from "./install-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function InstallGuideDialog() {
  const { env, guideOpen, setGuideOpen, returnFocus } = useInstall()
  return (
    <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          returnFocus.current?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>Instalar aplicativo</DialogTitle>
          <DialogDescription>
            Tenha um ícone da agenda no seu dispositivo para abrir com facilidade.
          </DialogDescription>
        </DialogHeader>
        {env?.browser === "internal" ? (
          <p className="type-body">
            Você está no navegador de outro aplicativo. Abra o menu desta tela e escolha Abrir no
            navegador. Use o Safari no iPhone/iPad ou o Chrome no Android e toque em Instalar
            aplicativo novamente.
          </p>
        ) : env?.platform === "ios" ? (
          <ol className="type-body list-decimal space-y-3 pl-5">
            <li>Abra este site no Safari do iPhone ou iPad.</li>
            <li>Toque em Compartilhar e depois em Adicionar à Tela de Início.</li>
            <li>Se aparecer a opção Abrir como App da Web, deixe-a ativada.</li>
            <li>Toque em Adicionar para confirmar.</li>
          </ol>
        ) : env?.browser === "safari" && env.platform === "mac" ? (
          <p className="type-body">
            No Safari, use Arquivo → Adicionar ao Dock e confirme em Adicionar.
          </p>
        ) : env?.browser === "chrome" || env?.browser === "edge" ? (
          <p className="type-body">
            {env.browser === "edge" ? "O Edge" : "O Chrome"} ainda não disponibilizou a confirmação
            de instalação. Procure a opção Instalar aplicativo no menu ou o ícone de instalação na
            barra de endereço. Se já instalou, abra pelo ícone da agenda no dispositivo.
          </p>
        ) : (
          <div className="type-body space-y-3">
            <p>
              No Android, abra o menu do Chrome e procure Instalar aplicativo ou Adicionar à tela
              inicial.
            </p>
            <p>
              No computador, procure o ícone de instalação na barra de endereço do Chrome ou Edge,
              ou a opção de instalar no menu do navegador.
            </p>
            <p>No Safari do Mac, use Arquivo → Adicionar ao Dock, quando disponível.</p>
            <p>
              Se a opção não aparecer, tente abrir este site no Chrome, Edge ou Safari atualizado.
              Se já instalou, procure o ícone da agenda no dispositivo.
            </p>
          </div>
        )}
        <p className="type-body text-secondary-txt">
          Para consultar e fazer agendamentos, você precisa de internet.
        </p>
      </DialogContent>
    </Dialog>
  )
}
