import type { NextConfig } from "next";

import { buildContentSecurityPolicy } from "./src/lib/csp";
// Valida as variáveis de ambiente no build e ao subir o servidor (falha cedo).
import { env } from "./src/server/env";

const contentSecurityPolicy = buildContentSecurityPolicy({
  publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  dev: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Cabeçalhos de segurança de todas as respostas (CLAUDE.md › Segurança).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
