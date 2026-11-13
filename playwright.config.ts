import "dotenv/config"
import { defineConfig, devices } from "@playwright/test"

import { E2E_BASE_URL, E2E_DATABASE_URL, E2E_PORT } from "./tests/e2e/env"

/*
 * Testes de ponta a ponta (Fase D3). Sobem a aplicação em produção
 * (`next build` + `next start`) numa porta própria, apontando para um banco
 * de teste separado (E2E_DATABASE_URL), migrado e semeado pelo global-setup.
 * Rodar: pnpm test:e2e (precisa do Postgres do docker compose no ar).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: E2E_BASE_URL,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec next build && pnpm exec next start -p ${E2E_PORT}`,
    /* o servidor sobe antes do global-setup criar o banco: a prova de vida é um arquivo estático */
    url: `${E2E_BASE_URL}/favicon.ico`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      AUTH_URL: E2E_BASE_URL,
      AUTH_TRUST_HOST: "true",
      /* sem e-mail nem Blob nos testes: cai no console e no disco */
      RESEND_API_KEY: "",
      BLOB_READ_WRITE_TOKEN: "",
    },
  },
})
