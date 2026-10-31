"use client"

import { useSyncExternalStore } from "react"

/* Hook de media query sem setState em efeito; no servidor devolve `fallback`. */
export function useMediaQuery(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  )
}

export const DESKTOP_QUERY = "(min-width: 1024px)"
export const XL_QUERY = "(min-width: 1280px)"
