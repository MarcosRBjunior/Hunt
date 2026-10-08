import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// O Prisma 7 não lê `.env*` sozinho. O @next/env carrega os mesmos arquivos que
// o Next (`.env.local` etc.) sem sobrescrever o que já veio do ambiente.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Com pooler, o CLI (migrate) usa a conexão direta. `generate` e `validate`
    // não conectam no banco, então rodam sem URL nenhuma (ex.: no CI).
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
