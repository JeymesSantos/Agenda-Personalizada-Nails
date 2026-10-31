import * as React from "react"
import { cn } from "cn"
import { LockIcon } from "lucide-react"

/*
 * Slot de horário do Figma (M4 / D2):
 * - disponível: fundo surface-2, borda subtle, texto primary
 * - selecionado: gradiente magenta, texto pink-100
 * - indisponível: tracejado, texto muted, cadeado
 */
function SlotButton({
  className,
  selected = false,
  unavailable = false,
  children,
  ...props
}: React.ComponentProps<"button"> & { selected?: boolean; unavailable?: boolean }) {
  return (
    <button
      type="button"
      data-slot="slot-button"
      data-selected={selected || undefined}
      data-unavailable={unavailable || undefined}
      aria-pressed={selected}
      disabled={unavailable || props.disabled}
      className={cn(
        "text-body-medium bg-surface-2 border-subtle text-foreground hover:border-strong focus-visible:ring-ring/50 inline-flex h-12 min-w-24 items-center justify-center gap-1.5 rounded-sm border px-4 transition-all outline-none focus-visible:ring-3 active:translate-y-px",
        "data-selected:bg-gradient-primary data-selected:border-transparent data-selected:font-semibold data-selected:text-pink-100",
        "data-unavailable:text-muted-txt data-unavailable:border-strong data-unavailable:cursor-not-allowed data-unavailable:border-dashed data-unavailable:bg-transparent",
        className,
      )}
      {...props}
    >
      {unavailable ? <LockIcon className="size-3.5" aria-hidden /> : null}
      {children}
    </button>
  )
}

export { SlotButton }
