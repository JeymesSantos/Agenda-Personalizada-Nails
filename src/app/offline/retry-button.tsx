"use client"

import { Button } from "@/components/ui/button"

/* Recarrega a URL pedida (o service worker serviu esta tela no lugar dela). */
export function RetryButton() {
  return (
    <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
      Tentar novamente
    </Button>
  )
}
