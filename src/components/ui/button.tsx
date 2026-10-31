import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

/*
 * Botões do Figma (brand board, "04 · UI Kit"):
 * - primary: pill com gradiente magenta e glow, texto pink-100
 * - secondary: pill com contorno border/strong, fundo transparente
 * - soft: pill em surface-2 (ações dentro de cards: Remarcar, Serviço)
 * - ghost: sem fundo, usado em barras e ícones
 * - danger: texto em feedback/error (Cancelar agendamento)
 * - link: texto magenta sublinhado no hover (Ver agenda, Ver tudo)
 */
const buttonVariants = cva(
  "group/button type-button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-primary glow-primary text-pink-100 hover:brightness-110 active:bg-gradient-primary-pressed",
        secondary:
          "border-strong bg-transparent text-foreground hover:bg-surface-2 aria-expanded:bg-surface-2",
        soft: "bg-surface-2 text-foreground hover:bg-elevated aria-expanded:bg-elevated",
        ghost: "text-foreground hover:bg-surface-2 aria-expanded:bg-surface-2",
        danger: "bg-surface-2 text-error hover:bg-error/10",
        link: "text-pink-300 h-auto rounded-none px-0 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6",
        lg: "h-14 px-8",
        sm: "h-10 px-4 text-[14px]",
        xs: "h-8 px-3 text-[13px] [&_svg:not([class*='size-'])]:size-4",
        icon: "size-12",
        "icon-sm": "size-10",
        "icon-xs": "size-8 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
)

function Button({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
