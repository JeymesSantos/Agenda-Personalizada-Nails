"use client"

import { useEffect, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AgendaView } from "../queries"

/*
 * Barra da agenda (A2): segmented Dia / Semana / Mês, setas e "Hoje", legenda.
 * Tudo vai na URL (?visao=&data=), então a página continua um Server Component.
 */
export function AgendaToolbar({
  view,
  prevYmd,
  nextYmd,
  todayYmd,
  title,
}: {
  view: AgendaView
  prevYmd: string
  nextYmd: string
  todayYmd: string
  title: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  const go = (patch: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v == null) sp.delete(k)
      else sp.set(k, v)
    }
    sp.delete("agendamento")
    startTransition(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }))
  }

  /* No celular a visão padrão é o dia (tela AM2). */
  useEffect(() => {
    if (!params.get("visao") && window.innerWidth < 1024) {
      const sp = new URLSearchParams(params.toString())
      sp.set("visao", "dia")
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={view} onValueChange={(v) => go({ visao: v })}>
          <TabsList className={pending ? "opacity-70" : undefined}>
            <TabsTrigger value="dia">Dia</TabsTrigger>
            <TabsTrigger value="semana">Semana</TabsTrigger>
            <TabsTrigger value="mes">Mês</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="bg-surface-2 border-subtle flex h-12 items-center rounded-full border px-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Anterior"
            onClick={() => go({ data: prevYmd })}
          >
            <ChevronLeftIcon />
          </Button>
          <Button variant="ghost" size="sm" className="px-3" onClick={() => go({ data: todayYmd })}>
            Hoje
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Próximo"
            onClick={() => go({ data: nextYmd })}
          >
            <ChevronRightIcon />
          </Button>
        </div>
        <span className="type-body-medium text-secondary-txt">{title}</span>
      </div>
      <ul className="type-body text-secondary-txt hidden items-center gap-4 lg:flex">
        <li className="flex items-center gap-2">
          <span className="bg-magenta-500 size-2 rounded-full" /> Agendado
        </li>
        <li className="flex items-center gap-2">
          <span className="bg-warning/70 size-2 rounded-full" /> Intervalo
        </li>
        <li className="flex items-center gap-2">
          <span className="bg-strong size-2 rounded-full" /> Bloqueado
        </li>
      </ul>
    </div>
  )
}
