"use client"

import * as React from "react"
import { useTransition } from "react"
import { LogOutIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { signOutAction } from "@/features/auth/actions"

export function SignOutButton({
  role,
  variant = "ghost",
  size = "sm",
}: {
  role: "ADMIN" | "CLIENT"
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
}) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant={variant}
      size={size}
      disabled={pending}
      onClick={() => startTransition(() => signOutAction(role))}
    >
      <LogOutIcon />
      Sair
    </Button>
  )
}
