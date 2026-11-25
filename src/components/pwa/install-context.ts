import { createContext, useContext } from "react"

import type { InstallEnvironment } from "./install-environment"

export type InstallVariant = "native" | "ios" | "internal" | "manual"
export type InstallStatus = "idle" | "pending" | "installed"

export type InstallState = {
  variant: InstallVariant | null
  env: InstallEnvironment | null
  status: InstallStatus
  message: string
  install: () => Promise<void>
  guideOpen: boolean
  setGuideOpen: (open: boolean) => void
  openGuide: (from?: HTMLElement | null) => void
  returnFocus: React.RefObject<HTMLElement | null>
  cardDismissed: boolean
  dismissCard: () => void
}

export const InstallContext = createContext<InstallState | null>(null)

export function useInstall(): InstallState {
  const value = useContext(InstallContext)
  if (!value) throw new Error("useInstall precisa estar dentro de InstallProvider")
  return value
}
