"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { DownloadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type InstallPromptEvent = Event & {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function subscribeDisplayMode(onChange: () => void) {
  const displayMode = window.matchMedia("(display-mode: standalone)")
  displayMode.addEventListener("change", onChange)
  return () => displayMode.removeEventListener("change", onChange)
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function InstallApp() {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const standalone = useSyncExternalStore(subscribeDisplayMode, isStandalone, () => true)
  const ios =
    !standalone &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1))
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const beforeInstall = (event: Event) => {
      event.preventDefault()
      setPrompt(event as InstallPromptEvent)
    }
    const appInstalled = () => {
      setInstalled(true)
      setPrompt(null)
      setOpen(false)
    }

    window.addEventListener("beforeinstallprompt", beforeInstall)
    window.addEventListener("appinstalled", appInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall)
      window.removeEventListener("appinstalled", appInstalled)
    }
  }, [])

  async function install() {
    if (!prompt) {
      setOpen(true)
      return
    }
    setPending(true)
    setPrompt(null)
    try {
      await prompt.prompt()
      await prompt.userChoice
    } catch {
      setOpen(true)
    } finally {
      setPending(false)
    }
  }

  if (installed || standalone) return null

  return (
    <div className="flex justify-center px-4 py-6">
      <Button ref={buttonRef} variant="ghost" onClick={install} disabled={pending}>
        <DownloadIcon aria-hidden="true" />
        {pending ? "Aguardando confirmação…" : "Instalar aplicativo"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            buttonRef.current?.focus()
          }}
        >
          <DialogHeader>
            <DialogTitle>Instalar aplicativo</DialogTitle>
            <DialogDescription>
              Tenha um ícone da agenda no seu dispositivo para abrir com facilidade.
            </DialogDescription>
          </DialogHeader>
          {ios ? (
            <ol className="type-body list-decimal space-y-3 pl-5">
              <li>Abra este site no Safari do iPhone ou iPad.</li>
              <li>Toque em Compartilhar e depois em Adicionar à Tela de Início.</li>
              <li>Se aparecer a opção Abrir como App da Web, deixe-a ativada.</li>
              <li>Toque em Adicionar para confirmar.</li>
            </ol>
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
    </div>
  )
}
