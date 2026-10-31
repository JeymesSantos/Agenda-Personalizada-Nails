import * as React from "react"
import { cn } from "cn"

/*
 * Inputs do Figma: 56px de altura, raio 14, fundo surface-2, borda border/strong,
 * ícone linear à esquerda opcional, placeholder em text/muted.
 */
const inputClassName =
  "text-body-l h-14 w-full min-w-0 rounded-md border border-input bg-surface-2 px-4 text-foreground transition-colors outline-none placeholder:text-muted-txt focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground"

function Input({
  className,
  type,
  startIcon,
  endIcon,
  ...props
}: React.ComponentProps<"input"> & {
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
}) {
  if (!startIcon && !endIcon) {
    return (
      <input type={type} data-slot="input" className={cn(inputClassName, className)} {...props} />
    )
  }

  return (
    <div data-slot="input-wrapper" className="relative w-full">
      {startIcon ? (
        <span className="text-muted-txt pointer-events-none absolute inset-y-0 left-4 flex items-center [&_svg]:size-5">
          {startIcon}
        </span>
      ) : null}
      <input
        type={type}
        data-slot="input"
        className={cn(inputClassName, startIcon && "pl-12", endIcon && "pr-12", className)}
        {...props}
      />
      {endIcon ? (
        <span className="text-muted-txt pointer-events-none absolute inset-y-0 right-4 flex items-center [&_svg]:size-5">
          {endIcon}
        </span>
      ) : null}
    </div>
  )
}

export { Input, inputClassName }
