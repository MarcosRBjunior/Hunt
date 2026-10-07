import type { NextConfig } from "next";

// Valida as variáveis de ambiente no build e ao subir o servidor (falha cedo).
import "./src/server/env";

const nextConfig: NextConfig = {
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
