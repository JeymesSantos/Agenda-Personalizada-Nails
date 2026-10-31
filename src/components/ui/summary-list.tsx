import * as React from "react"
import { cn } from "cn"

/*
 * Lista de resumo do Figma (M5 "Resumo", M6 "Comprovante", A2 "Detalhe"):
 * linhas com ícone linear, rótulo em secondary e valor alinhado à direita.
 * Valores monetários usam `highlight` (pink-300, semibold).
 */
function SummaryList({
  className,
  title,
  ...props
}: React.ComponentProps<"dl"> & { title?: string }) {
  return (
    <div
      data-slot="summary"
      className={cn("bg-surface border-subtle rounded-md border p-5", className)}
    >
      {title ? <p className="text-caption text-secondary-txt mb-4">{title}</p> : null}
      <dl className="flex flex-col gap-3.5" {...props} />
    </div>
  )
}

function SummaryRow({
  className,
  icon,
  label,
  children,
  highlight = false,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: React.ReactNode
  label: string
  highlight?: boolean
}) {
  return (
    <div
      data-slot="summary-row"
      className={cn("flex items-center justify-between gap-4", className)}
      {...props}
    >
      <dt className="text-body text-secondary-txt flex items-center gap-2.5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-pink-300">
        {icon}
        {label}
      </dt>
      <dd
        className={cn(
          "text-body-medium text-foreground text-right",
          highlight && "text-h3 text-pink-300",
        )}
      >
        {children}
      </dd>
    </div>
  )
}

export { SummaryList, SummaryRow }
