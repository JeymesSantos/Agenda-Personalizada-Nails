"use client"

import { useEffect } from "react"

/*
 * Registra o service worker do PWA (public/sw.js). Só uma vez por carga;
 * em navegadores sem suporte não faz nada.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined)
  }, [])
  return null
}
