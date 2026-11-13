/*
 * Ambiente dos testes e2e. O banco de teste é separado do de desenvolvimento:
 * por padrão, o mesmo Postgres do docker compose com o banco `minhaagenda_test`.
 */
export const E2E_PORT = Number(process.env.E2E_PORT ?? 3100)
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`

function defaultTestDatabaseUrl(): string {
  const dev =
    process.env.DATABASE_URL ??
    "postgresql://minhaagenda:minhaagenda@localhost:5432/minhaagenda?schema=public"
  const url = new URL(dev)
  url.pathname = "/minhaagenda_test"
  return url.toString()
}

export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? defaultTestDatabaseUrl()
