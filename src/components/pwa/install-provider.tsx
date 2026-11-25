"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"

import {
  InstallContext,
  type InstallState,
  type InstallStatus,
  type InstallVariant,
} from "./install-context"
import { detectInstallEnvironment } from "./install-environment"
import { InstallGuideDialog } from "./install-guide-dialog"

type PromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "install-card-dismissed-until"
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function subscribeHydration() {
  return () => {}
}
function subscribeDisplayMode(onChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)")
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}
function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}
function isDismissed() {
  try {
    return Number(localStorage.getItem(DISMISS_KEY)) > Date.now()
  } catch {
    return false
  }
}
function subscribeDismissal(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined
  const sync = () => {
    clearTimeout(timer)
    onChange()
    try {
      const remaining = Number(localStorage.getItem(DISMISS_KEY)) - Date.now()
      if (remaining > 0) timer = setTimeout(sync, Math.min(remaining, WEEK_MS))
    } catch {
      /* Storage indisponível: dispensa somente nesta sessão. */
    }
  }
  sync()
  window.addEventListener("storage", sync)
  window.addEventListener("install-card-dismissed", sync)
  return () => {
    clearTimeout(timer)
    window.removeEventListener("storage", sync)
    window.removeEventListener("install-card-dismissed", sync)
  }
}

export function InstallProvider({ children }: { children: React.ReactNode }) {
  const prompt = useRef<PromptEvent | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  )
  const env = hydrated
    ? detectInstallEnvironment(navigator.userAgent, navigator.platform, navigator.maxTouchPoints)
    : null
  const hasNative =
    hydrated && typeof (navigator as Navigator & { install?: unknown }).install === "function"
  const [canPrompt, setCanPrompt] = useState(false)
  const standalone = useSyncExternalStore(subscribeDisplayMode, isStandalone, () => true)
  const [status, setStatus] = useState<InstallStatus>("idle")
  const [message, setMessage] = useState("")
  const [guideOpen, setGuideOpen] = useState(false)
  const [sessionDismissed, setSessionDismissed] = useState(false)
  const storedDismissed = useSyncExternalStore(subscribeDismissal, isDismissed, () => true)
  const cardDismissed = sessionDismissed || storedDismissed

  useEffect(() => {
    const before = (event: Event) => {
      event.preventDefault()
      prompt.current = event as PromptEvent
      setCanPrompt(true)
    }
    const installed = () => {
      prompt.current = null
      setCanPrompt(false)
      setStatus("installed")
      setGuideOpen(false)
    }
    window.addEventListener("beforeinstallprompt", before)
    window.addEventListener("appinstalled", installed)
    return () => {
      window.removeEventListener("beforeinstallprompt", before)
      window.removeEventListener("appinstalled", installed)
    }
  }, [])

  const openGuide = useCallback((from?: HTMLElement | null) => {
    returnFocus.current = from ?? (document.activeElement as HTMLElement | null)
    setGuideOpen(true)
  }, [])

  const dismissCard = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + WEEK_MS))
      window.dispatchEvent(new Event("install-card-dismissed"))
    } catch {
      setSessionDismissed(true)
    }
  }, [])

  const install = useCallback(async () => {
    if (status === "pending") return
    const nav = navigator as Navigator & { install?: () => Promise<void> }
    const nativeInstall =
      env?.browser !== "internal" && typeof nav.install === "function" ? nav.install : null
    if (env?.browser === "internal" || (!nativeInstall && !prompt.current)) {
      openGuide()
      return
    }
    const current = prompt.current
    setStatus("pending")
    setMessage("")
    prompt.current = null
    try {
      if (nativeInstall) {
        await nativeInstall.call(navigator) // chamada direta no clique, sem await antes
        setStatus("installed")
      } else if (current) {
        await current.prompt()
        const choice = await current.userChoice
        if (choice.outcome === "dismissed")
          setMessage("Instalação cancelada. Você pode continuar usando o site.")
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setMessage("Instalação cancelada. Você pode tentar novamente quando quiser.")
      } else {
        setMessage("Não foi possível iniciar a instalação neste navegador.")
        openGuide()
      }
    } finally {
      setCanPrompt(prompt.current !== null)
      setStatus((s) => (s === "installed" ? s : "idle"))
    }
  }, [env, status, openGuide])

  const variant: InstallVariant | null =
    !env || standalone || status === "installed"
      ? null
      : env.browser === "internal"
        ? "internal"
        : hasNative || canPrompt
          ? "native"
          : env.platform === "ios"
            ? "ios"
            : "manual"

  const value: InstallState = {
    variant,
    env,
    status,
    message,
    install,
    guideOpen,
    setGuideOpen,
    openGuide,
    returnFocus,
    cardDismissed,
    dismissCard,
  }

  return (
    <InstallContext.Provider value={value}>
      {children}
      <InstallGuideDialog />
      {variant === "manual" && (
        <p role="status" className="type-body text-secondary-txt px-5 empty:hidden">
          {message}
        </p>
      )}
    </InstallContext.Provider>
  )
}
