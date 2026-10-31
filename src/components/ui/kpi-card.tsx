import * as React from "react"
import { cn } from "cn"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

/*
 * Card KPI do Figma (dashboard A1 / AM1): ícone em quadrado magenta,
 * rótulo, valor 32px, variação (verde para alta, vermelha para queda)
 * ou texto de apoio.
 */
function KpiCard({
  className,
  icon,
  label,
  value,
  delta,
  deltaTone = "success",
  hint,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: React.ReactNode
  label: string
  value: React.ReactNode
  delta?: string
  deltaTone?: "success" | "error" | "neutral"
  hint?: string
}) {
  return (
    <div
      data-slot="kpi-card"
      className={cn(
        "bg-surface border-subtle flex flex-col gap-3 rounded-md border p-4 sm:p-5",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {icon ? (
          <span className="bg-gradient-primary flex size-9 shrink-0 items-center justify-center rounded-sm text-pink-100 [&_svg]:size-[18px]">
            {icon}
          </span>
        ) : null}
        <span className="type-body text-secondary-txt">{label}</span>
      </div>
      <p className="type-kpi text-[28px] leading-8 sm:text-[32px] sm:leading-9">{value}</p>
      {delta ? (
        <p
          className={cn(
            "type-body-medium flex items-center gap-1.5",
            deltaTone === "success" && "text-success",
            deltaTone === "error" && "text-error",
            deltaTone === "neutral" && "text-secondary-txt",
          )}
        >
          {deltaTone === "error" ? (
            <TrendingDownIcon className="size-4" aria-hidden />
          ) : deltaTone === "success" ? (
            <TrendingUpIcon className="size-4" aria-hidden />
          ) : null}
          {delta}
        </p>
      ) : hint ? (
        <p className="type-body text-secondary-txt">{hint}</p>
      ) : null}
    </div>
  )
}

export { KpiCard }
