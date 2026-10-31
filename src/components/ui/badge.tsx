import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

/*
 * Badges de status do Figma: caixa alta 11px, pill, fundo da cor a 14%,
 * com ponto à esquerda (CONFIRMADO, PENDENTE, CANCELADO, FALTA, CONCLUÍDO).
 * Também usados para tags FIXA / VARIÁVEL nas despesas e etiquetas "CAPA".
 */
const badgeVariants = cva(
  "group/badge type-caption inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 rounded-full border border-transparent px-2.5 whitespace-nowrap transition-colors [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        success: "bg-success/14 text-success",
        warning: "bg-warning/14 text-warning",
        error: "bg-error/14 text-error",
        info: "bg-info/14 text-info",
        magenta: "bg-magenta-500/18 text-pink-300",
        neutral: "bg-surface-2 text-secondary-txt",
        dark: "bg-base/80 text-foreground",
        outline: "border-strong text-foreground",
      },
      dot: {
        true: "before:size-1.5 before:rounded-full before:bg-current",
        false: "",
      },
    },
    defaultVariants: {
      variant: "neutral",
      dot: false,
    },
  },
)

function Badge({
  className,
  variant = "neutral",
  dot = false,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, dot }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
