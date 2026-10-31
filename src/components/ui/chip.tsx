import * as React from "react"
import { cn } from "cn"

/*
 * Chips de filtro do Figma ("Todos", "Alongamento", "Nail art"):
 * pill 40px, contorno border/strong; ativo com contorno e texto magenta
 * e fundo magenta a 10%.
 */
function Chip({
  className,
  active = false,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      data-slot="chip"
      data-active={active || undefined}
      aria-pressed={active}
      className={cn(
        "type-body-medium border-strong text-secondary-txt hover:text-foreground focus-visible:ring-ring/50 inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 whitespace-nowrap transition-colors outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50",
        "data-active:border-magenta-500 data-active:bg-magenta-500/10 data-active:text-pink-300",
        className,
      )}
      {...props}
    />
  )
}

/* Linha de chips com rolagem horizontal, sem barra visível (mobile). */
function ChipGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chip-group"
      className={cn(
        "flex [scrollbar-width:none] gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    />
  )
}

export { Chip, ChipGroup }
