"use server"

import bcrypt from "bcryptjs"
import { AuthError } from "next-auth"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { redirect } from "next/navigation"

import { signIn, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { loginSchema, registerSchema, safeNext, type FormState } from "./schemas"

function formValues(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]))
}

async function loginWith(
  role: "ADMIN" | "CLIENT",
  fallback: string,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData, ["email", "next"])
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values }
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      role,
      redirectTo: safeNext(parsed.data.next, fallback),
    })
  } catch (error) {
    if (isRedirectError(error)) throw error
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha incorretos.", values }
    }
    throw error
  }
  return {}
}

export async function loginClientAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return loginWith("CLIENT", "/meus-horarios", formData)
}

export async function loginAdminAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return loginWith("ADMIN", "/admin", formData)
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["name", "whatsapp", "email", "next"])
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
    next: formData.get("next") || undefined,
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values }
  }
  const { name, whatsapp, email, password, next } = parsed.data

  const existingEmail = await prisma.user.findUnique({ where: { email } })
  if (existingEmail?.passwordHash) {
    return {
      fieldErrors: { email: ["Já existe uma conta com esse e-mail. Entre para continuar."] },
      values,
    }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const existingByWhatsapp = await prisma.user.findUnique({ where: { whatsapp } })

  if (
    existingByWhatsapp &&
    existingByWhatsapp.role === "CLIENT" &&
    !existingByWhatsapp.passwordHash
  ) {
    /* Cliente que já agendou sem cadastro: a conta assume o histórico dela. */
    await prisma.user.update({
      where: { id: existingByWhatsapp.id },
      data: { name, email, passwordHash },
    })
  } else if (existingByWhatsapp) {
    return {
      fieldErrors: { whatsapp: ["Esse WhatsApp já está em uma conta. Entre para continuar."] },
      values,
    }
  } else {
    await prisma.user.create({ data: { name, whatsapp, email, passwordHash, role: "CLIENT" } })
  }

  try {
    await signIn("credentials", {
      email,
      password,
      role: "CLIENT",
      redirectTo: safeNext(next, "/meus-horarios"),
    })
  } catch (error) {
    if (isRedirectError(error)) throw error
    throw error
  }
  return {}
}

export async function signOutAction(role: "ADMIN" | "CLIENT") {
  await signOut({ redirect: false })
  redirect(role === "ADMIN" ? "/admin/entrar" : "/")
}
