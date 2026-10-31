import * as React from "react"
import { cn } from "cn"

/*
 * Cabeçalho de página do Figma: rótulo em Display/Label (caps, tracking 30%)
 * em pink-300 acima do título. Variantes:
 * - display: título em Montserrat Light caps (telas da cliente: PORTFÓLIO, MEUS HORÁRIOS)
 * - heading: título em DM Sans Bold 28 (admin: "Boa noite, Letícia", "Agenda")
 */
function PageHeader({
  className,
  eyebrow,
  title,
  description,
  variant = "display",
  leading,
  actions,
  ...props
}: React.ComponentProps<"header"> & {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  variant?: "display" | "heading"
  leading?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <header
      data-slot="page-header"
      className={cn("flex items-start justify-between gap-4", className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        {leading}
        <div className="flex flex-col gap-1">
          {eyebrow ? <p className="display-label text-pink-300">{eyebrow}</p> : null}
          <h1 className={variant === "display" ? "display-l" : "text-h1"}>{title}</h1>
          {description ? (
            <p className="text-body-l text-secondary-txt mt-1 max-w-prose">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </header>
  )
}

export { PageHeader }
