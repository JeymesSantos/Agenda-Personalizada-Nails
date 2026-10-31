import * as React from "react"
import { cn } from "cn"
import { CheckIcon } from "lucide-react"

/*
 * Stepper do fluxo de agendamento (D2): "✓ Serviço — 2 Data e horário — 3 Seus dados".
 * Concluído: círculo verde com check; atual: círculo magenta; futuro: contorno.
 */
function Stepper({
  className,
  steps,
  current,
  ...props
}: React.ComponentProps<"ol"> & { steps: string[]; current: number }) {
  return (
    <ol data-slot="stepper" className={cn("flex items-center gap-3", className)} {...props}>
      {steps.map((label, index) => {
        const state = index < current ? "done" : index === current ? "current" : "todo"
        return (
          <li key={label} className="flex items-center gap-3">
            <span className="flex items-center gap-2.5">
              <span
                data-state={state}
                className={cn(
                  "text-body-medium flex size-7 items-center justify-center rounded-full border text-[13px]",
                  state === "done" && "bg-success/15 border-success/40 text-success",
                  state === "current" && "bg-magenta-500 border-magenta-500 text-pink-100",
                  state === "todo" && "border-strong text-muted-txt",
                )}
              >
                {state === "done" ? <CheckIcon className="size-3.5" aria-hidden /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-body-medium",
                  state === "current" ? "text-foreground" : "text-muted-txt",
                  state === "done" && "text-secondary-txt",
                )}
              >
                {label}
              </span>
            </span>
            {index < steps.length - 1 ? <span className="bg-strong h-px w-12" aria-hidden /> : null}
          </li>
        )
      })}
    </ol>
  )
}

export { Stepper }
