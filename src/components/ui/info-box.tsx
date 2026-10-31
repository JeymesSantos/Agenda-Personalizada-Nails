import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { BellIcon, ClockIcon, CheckIcon, TriangleAlertIcon, RepeatIcon } from "lucide-react"

/*
 * Caixas de aviso do Figma: fundo da cor a 12%, ícone linear, texto body.
 * info (azul): "Horários calculados para 2h de serviço..."
 * success (verde): "Lucro de outubro: R$ 6.150"
 * warning (âmbar): pendências
 * magenta: "Impacto na agenda"
 */
const infoBoxVariants = cva(
  "text-body flex items-start gap-3 rounded-md border p-4 [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        info: "bg-info/12 border-info/25 text-secondary-txt [&_svg]:text-info",
        success: "bg-success/12 border-success/25 text-secondary-txt [&_svg]:text-success",
        warning: "bg-warning/12 border-warning/25 text-secondary-txt [&_svg]:text-warning",
        error: "bg-error/12 border-error/25 text-secondary-txt [&_svg]:text-error",
        magenta: "bg-magenta-500/10 border-magenta-500/30 text-secondary-txt [&_svg]:text-pink-300",
      },
    },
    defaultVariants: { tone: "info" },
  },
)

const defaultIcons = {
  info: <ClockIcon aria-hidden />,
  success: <CheckIcon aria-hidden />,
  warning: <BellIcon aria-hidden />,
  error: <TriangleAlertIcon aria-hidden />,
  magenta: <RepeatIcon aria-hidden />,
} as const

function InfoBox({
  className,
  tone = "info",
  icon,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof infoBoxVariants> & { icon?: React.ReactNode }) {
  return (
    <div data-slot="info-box" className={cn(infoBoxVariants({ tone }), className)} {...props}>
      {icon ?? defaultIcons[tone ?? "info"]}
      <div className="flex-1">{children}</div>
    </div>
  )
}

export { InfoBox, infoBoxVariants }
