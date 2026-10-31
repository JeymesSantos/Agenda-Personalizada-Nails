import * as React from "react"
import { Badge } from "@/components/ui/badge"

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "DONE" | "CANCELLED" | "NO_SHOW"

const statusConfig: Record<
  AppointmentStatus,
  { label: string; variant: "success" | "warning" | "error" | "info" | "neutral" }
> = {
  PENDING: { label: "Pendente", variant: "warning" },
  CONFIRMED: { label: "Confirmado", variant: "success" },
  DONE: { label: "Concluído", variant: "info" },
  CANCELLED: { label: "Cancelado", variant: "error" },
  NO_SHOW: { label: "Falta", variant: "neutral" },
}

function StatusBadge({
  status,
  ...props
}: Omit<React.ComponentProps<typeof Badge>, "variant" | "children"> & {
  status: AppointmentStatus
}) {
  const { label, variant } = statusConfig[status]
  return (
    <Badge variant={variant} dot {...props}>
      {label}
    </Badge>
  )
}

export { StatusBadge, statusConfig }
