/*
 * Cria (ou redefine) a conta da profissional e o estúdio em um banco vazio,
 * sem passar pelo seed de demonstração. Idempotente: se já existe um estúdio,
 * atualiza nome, e-mail e senha da dona; senão cria usuária ADMIN, estúdio e
 * horário de funcionamento padrão (seg–sáb, 9h–19h, almoço 12h30–13h45).
 *
 * Uso (DATABASE_URL do ambiente alvo):
 *   pnpm admin:create --email leticia@exemplo.com --senha "uma senha forte" \
 *     --nome "Letícia Fagundes" --estudio "Letícia Fagundes" --slug leticia --prefixo LF
 */
import "dotenv/config"
import { parseArgs } from "node:util"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

import { PrismaClient } from "../src/generated/prisma/client"

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    senha: { type: "string" },
    nome: { type: "string" },
    estudio: { type: "string" },
    slug: { type: "string" },
    prefixo: { type: "string" },
    whatsapp: { type: "string" },
    fuso: { type: "string", default: "America/Sao_Paulo" },
  },
})

function fail(message: string): never {
  console.error(`✗ ${message}`)
  process.exit(1)
}

const email = values.email?.trim().toLowerCase()
const password = values.senha
if (!email || !email.includes("@")) fail("Informe --email")
if (!password || password.length < 8) fail("Informe --senha com pelo menos 8 caracteres")

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const passwordHash = await bcrypt.hash(password!, 10)
  const existing = await prisma.business.findFirst({ include: { owner: true } })

  if (existing) {
    const name = values.nome?.trim() || existing.owner.name
    await prisma.user.update({
      where: { id: existing.ownerId },
      data: { email, name, passwordHash, role: "ADMIN" },
    })
    if (values.estudio?.trim()) {
      await prisma.business.update({
        where: { id: existing.id },
        data: { name: values.estudio.trim() },
      })
    }
    console.log(
      `✓ credenciais da profissional atualizadas (${email}) no estúdio "${existing.name}"`,
    )
    return
  }

  const name = values.nome?.trim() || fail("Informe --nome")
  const studio = values.estudio?.trim() || name
  const slug =
    values.slug?.trim().toLowerCase() ||
    studio
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  const codePrefix =
    values.prefixo?.trim().toUpperCase() ||
    name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()

  const owner = await prisma.user.create({
    data: { name, email, passwordHash, role: "ADMIN", whatsapp: values.whatsapp?.trim() || null },
  })
  const business = await prisma.business.create({
    data: {
      ownerId: owner.id,
      name: studio,
      slug,
      codePrefix,
      timezone: values.fuso ?? "America/Sao_Paulo",
      whatsapp: values.whatsapp?.trim() || null,
      hoursSummary: "Seg a Sáb · 9h–19h",
    },
  })
  await prisma.workingHours.createMany({
    data: Array.from({ length: 7 }, (_, weekday) => ({
      businessId: business.id,
      weekday,
      enabled: weekday !== 0,
      startMin: 9 * 60,
      endMin: 19 * 60,
      breakStartMin: 12 * 60 + 30,
      breakEndMin: 13 * 60 + 45,
    })),
  })
  console.log(`✓ estúdio "${studio}" (/${slug}) criado; entre em /admin/entrar com ${email}`)
  console.log("  Ajuste horário, serviços, bio e fundos pelo painel.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
