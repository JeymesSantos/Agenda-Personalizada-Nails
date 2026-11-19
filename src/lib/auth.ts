import "server-only"
import bcrypt from "bcryptjs"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

import { authConfig } from "@/lib/auth.config"
import { prisma } from "@/lib/prisma"
import { clientLoginSchema, loginSchema } from "@/features/auth/schemas"

const credentialsSchema = z.discriminatedUnion("role", [
  loginSchema.extend({ role: z.literal("ADMIN") }),
  clientLoginSchema.extend({ role: z.literal("CLIENT") }),
])

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        whatsapp: {},
        password: {},
        role: {},
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null
        const credentials = parsed.data

        const user = await prisma.user.findUnique({
          where:
            credentials.role === "ADMIN"
              ? { email: credentials.email }
              : { whatsapp: credentials.whatsapp },
        })
        if (!user?.passwordHash) return null
        if (user.role !== credentials.role) return null

        const ok = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!ok) return null

        return {
          id: user.id,
          name: user.name,
          email: user.role === "ADMIN" ? user.email : null,
          role: user.role,
        }
      },
    }),
  ],
})
