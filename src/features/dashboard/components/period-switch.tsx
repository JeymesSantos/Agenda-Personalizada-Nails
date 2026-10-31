"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PeriodKind } from "@/lib/dates"

const options: { value: PeriodKind; label: string }[] = [
  { value: "dia", label: "Dia" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
  { value: "ano", label: "Ano" },
]

/* Seletor Dia / Semana / Mês / Ano do dashboard; o período vai na URL (?periodo=). */
export function PeriodSwitch({ value, className }: { value: PeriodKind; className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        const sp = new URLSearchParams(params.toString())
        sp.set("periodo", next)
        startTransition(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }))
      }}
      className={className}
    >
      <TabsList className={pending ? "opacity-70" : undefined}>
        {options.map((o) => (
          <TabsTrigger key={o.value} value={o.value} className="px-4 sm:px-5">
            {o.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
