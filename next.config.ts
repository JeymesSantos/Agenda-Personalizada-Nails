import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /*
   * Cache Components desligado: quase todas as telas dependem da sessão
   * (cliente ou profissional) e de dados em tempo real da agenda, então
   * as páginas são renderizadas por requisição, como no Next 15.
   */
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
