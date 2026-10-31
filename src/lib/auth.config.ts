import type { NextAuthConfig } from "next-auth"

import type { Role } from "@/generated/prisma/enums"

/*
 * Configuração do Auth.js compartilhada entre o proxy (sem acesso ao banco)
 * e o servidor. O provider Credentials, que usa Prisma e bcrypt, fica em auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/entrar",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.name = user.name
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as Role
      session.user.name = token.name ?? session.user.name
      return session
    },
  },
} satisfies NextAuthConfig
