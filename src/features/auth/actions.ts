"use server"

import bcrypt from "bcryptjs"
import { AuthError } from "next-auth"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { readInvitation } from "./invitation"

import { Prisma } from "@/generated/prisma/client"
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
  const invitation = String(formData.get("invitation") ?? "")
  const invitedId = invitation ? readInvitation(invitation) : null
  if (invitation && !invitedId)
    return { error: "Convite inválido ou expirado. Peça um novo ao studio.", values }
  const invited = invitedId
    ? await prisma.user.findFirst({
        where: { id: invitedId, role: "CLIENT", passwordHash: null, whatsapp },
      })
    : null
  if (invitedId && !invited)
    return {
      error: "O convite já foi usado ou o WhatsApp não corresponde ao cadastro do studio.",
      values,
    }

  const existingEmail = await prisma.user.findUnique({ where: { email } })
  if (existingEmail && existingEmail.id !== invited?.id) {
    return {
      fieldErrors: { email: ["Já existe uma conta com esse e-mail. Entre para continuar."] },
      values,
    }
  }

  const existingByWhatsapp = await prisma.user.findUnique({ where: { whatsapp } })

  if (existingByWhatsapp && existingByWhatsapp.id !== invited?.id) {
    return {
      fieldErrors: {
        whatsapp: [
          "Este WhatsApp já está cadastrado. Se agendou pelo studio, peça um convite para criar sua conta. Se já tem conta, entre para continuar.",
        ],
      },
      values,
    }
  }

  /* Apenas um convite emitido pelo admin permite incorporar o cadastro existente. */
  const passwordHash = await bcrypt.hash(password, 10)
  try {
    if (invited) {
      const updated = await prisma.user.updateMany({
        where: { id: invited.id, role: "CLIENT", passwordHash: null, whatsapp },
        data: { name, email, passwordHash },
      })
      if (updated.count !== 1) return { error: "Convite já utilizado. Entre na sua conta.", values }
    } else {
      await prisma.user.create({ data: { name, whatsapp, email, passwordHash, role: "CLIENT" } })
    }
  } catch (error) {
    /* Outra solicitação pode ter usado o e-mail/WhatsApp após as consultas acima. */
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        error: "Não foi possível criar a conta com esses dados. Entre ou fale com o studio.",
        values,
      }
    }
    throw error
  }

  revalidatePath("/admin/clientes")
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

/* Versões sem argumento para passar como prop a componentes de cliente. */
export async function signOutAdminAction() {
  await signOutAction("ADMIN")
}

export async function signOutClientAction() {
  await signOutAction("CLIENT")
}
