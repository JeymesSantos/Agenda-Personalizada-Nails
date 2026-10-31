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
}: Omit<React.ComponentProps<"header">, "title"> & {
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
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}
      {...props}
    >
      <div className="flex min-w-0 items-start gap-3">
        {leading}
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow ? <p className="display-label text-pink-300">{eyebrow}</p> : null}
          <h1 className={cn("break-words", variant === "display" ? "display-l" : "type-h1")}>
            {title}
          </h1>
          {description ? (
            <p className="type-body-l text-secondary-txt mt-1 max-w-prose">{description}</p>
          ) : null}
        </div>
      </div>
      {/* no celular as ações descem para a própria linha e quebram quando precisam */}
      {actions ? (
        <div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  )
}

export { PageHeader }
