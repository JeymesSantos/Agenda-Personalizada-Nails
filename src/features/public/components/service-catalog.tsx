"use client"

import { useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"

import { Chip, ChipGroup } from "@/components/ui/chip"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ServiceCard, type ServiceCardData } from "@/features/services/components/service-card"

export type CatalogService = ServiceCardData & {
  id: string
  categoryId: string | null
  categoryName: string | null
}

/* Catálogo (M3 / "Ver todos os serviços"): busca, chips por categoria e cards com Agendar. */
export function ServiceCatalog({
  services,
  ctaLabel = "Agendar",
}: {
  services: CatalogService[]
  ctaLabel?: string
}) {
  const [query, setQuery] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)

  const categories = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of services)
      if (s.categoryId && s.categoryName) map.set(s.categoryId, s.categoryName)
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [services])

  const filtered = services.filter((s) => {
    if (categoryId && s.categoryId !== categoryId) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      s.title.toLowerCase().includes(q) ||
      (s.description ?? "").toLowerCase().includes(q) ||
      (s.categoryName ?? "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="busca">Buscar</Label>
        <Input
          id="busca"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Alongamento, manutenção, nail art…"
          startIcon={<SearchIcon />}
        />
      </div>
      {categories.length > 0 ? (
        <ChipGroup>
          <Chip active={categoryId === null} onClick={() => setCategoryId(null)}>
            Todos
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c.id}
              active={categoryId === c.id}
              onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
            >
              {c.name}
            </Chip>
          ))}
        </ChipGroup>
      ) : null}
      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum serviço encontrado"
          description="Tente outra palavra ou categoria."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              href={`/agendar/${s.id}/horario`}
              ctaLabel={ctaLabel}
            />
          ))}
        </div>
      )}
    </div>
  )
}
