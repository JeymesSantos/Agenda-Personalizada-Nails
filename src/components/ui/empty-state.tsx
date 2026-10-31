import * as React from "react"
import { cn } from "cn"
import { SparklesIcon } from "lucide-react"

function EmptyState({
  className,
  icon,
  title,
  description,
  action,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "border-strong flex flex-col items-center gap-3 rounded-md border border-dashed px-6 py-10 text-center",
        className,
      )}
      {...props}
    >
      <span className="bg-surface-2 flex size-12 items-center justify-center rounded-full text-pink-300 [&_svg]:size-5">
        {icon ?? <SparklesIcon aria-hidden />}
      </span>
      <p className="text-h3">{title}</p>
      {description ? <p className="text-body text-secondary-txt max-w-xs">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

export { EmptyState }
