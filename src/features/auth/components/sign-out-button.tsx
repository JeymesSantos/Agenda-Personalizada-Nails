"use client"

import { useTransition } from "react"
import { LogOutIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { signOutAction } from "@/features/auth/actions"

export function SignOutButton({ role }: { role: "ADMIN" | "CLIENT" }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => signOutAction(role))}
    >
      <LogOutIcon />
      Sair
    </Button>
  )
}
