import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    testTimeout: 20000,
    environment: "node",
  },
})
