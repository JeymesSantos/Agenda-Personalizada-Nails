import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /*
   * Cache Components desligado: quase todas as telas dependem da sessão
   * (cliente ou profissional) e de dados em tempo real da agenda, então
   * as páginas são renderizadas por requisição, como no Next 15.
   */
  cacheComponents: false,
  images: {
    /* placeholders do seed e logos são SVG; CSP restritiva por segurança */
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    /* 70 é usado nas fotos do slideshow de fundo (hero-slideshow) */
    qualities: [70, 75],
  },
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
