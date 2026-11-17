"use client"

import type { ComponentProps } from "react"
import { Input } from "./input"
import { formatPhoneInput } from "@/lib/phone"

export function PhoneInput({
  onChange,
  value,
  defaultValue,
  ...props
}: ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      value={typeof value === "string" ? formatPhoneInput(value) : value}
      defaultValue={
        typeof defaultValue === "string" ? formatPhoneInput(defaultValue) : defaultValue
      }
      onChange={(event) => {
        event.target.value = formatPhoneInput(event.target.value)
        onChange?.(event)
      }}
    />
  )
}
