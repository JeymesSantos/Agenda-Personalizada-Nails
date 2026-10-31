"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"

/* Busca por nome ou WhatsApp; o termo vai para ?q= com um pequeno atraso. */
export function ClientSearch({ initial }: { initial: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [value, setValue] = useState(initial)
  const [pending, startTransition] = useTransition()
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = setTimeout(() => {
      const sp = new URLSearchParams(params.toString())
      if (value.trim()) sp.set("q", value.trim())
      else sp.delete("q")
      startTransition(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }))
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Buscar por nome ou WhatsApp"
      startIcon={<SearchIcon />}
      className={pending ? "opacity-70" : undefined}
      aria-label="Buscar cliente"
    />
  )
}
