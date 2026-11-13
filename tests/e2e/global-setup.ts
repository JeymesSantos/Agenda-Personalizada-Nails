import "dotenv/config"
import { execSync } from "node:child_process"
import { Client } from "pg"

import { E2E_DATABASE_URL } from "./env"

/*
 * Antes da suíte: garante o banco de teste, aplica as migrations e roda o
 * seed (dados do Figma, com agendamentos em torno de hoje). Cada execução
 * parte do mesmo estado. Usa `pg` direto porque o cliente Prisma gerado é
 * ESM e o runner do Playwright não o carrega.
 */
export default async function globalSetup() {
  await ensureDatabase()
  const env = { ...process.env, DATABASE_URL: E2E_DATABASE_URL }
  execSync("pnpm exec prisma migrate deploy", { stdio: "inherit", env })
  execSync("pnpm exec tsx prisma/seed.ts", { stdio: "inherit", env })
}

/* CREATE DATABASE precisa ser feito conectado a outro banco (o de desenvolvimento). */
async function ensureDatabase() {
  const target = new URL(E2E_DATABASE_URL)
  const dbName = target.pathname.replace(/^\//, "")
  const admin = new URL(E2E_DATABASE_URL)
  const devDb = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).pathname : ""
  admin.pathname = devDb && devDb !== target.pathname ? devDb : "/postgres"
  admin.search = ""
  const client = new Client({ connectionString: admin.toString() })
  await client.connect()
  try {
    const { rows } = await client.query<{ exists: boolean }>(
      "select exists(select 1 from pg_database where datname = $1) as exists",
      [dbName],
    )
    if (!rows[0]?.exists) {
      await client.query(`create database "${dbName}"`)
      console.log(`→ banco de teste ${dbName} criado`)
    }
  } finally {
    await client.end()
  }
}
