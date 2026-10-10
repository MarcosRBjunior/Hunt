import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

import { env } from "./env";

/** No Prisma 7 o driver `pg` espera a conexão para sempre por padrão. */
const CONNECTION_TIMEOUT_MS = 5_000;

export function createPrismaClient(connectionString: string): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    }),
    transactionOptions: {
      // O padrão (2 s) para abrir a transação é menor que o tempo de conectar
      // no Railway (1,4–2 s medidos na Fase 4): espera a conexão abrir.
      maxWait: CONNECTION_TIMEOUT_MS + 1_000,
      timeout: 10_000,
    },
  });
}

// Guardado no globalThis para o hot reload do `next dev` não abrir um pool novo
// a cada recarga.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Prisma Client único da aplicação, criado só no primeiro uso: com
 * `PRODUCT_SOURCE=mock` o banco nem é tocado e `DATABASE_URL` pode faltar.
 */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL não definida (veja .env.example)");
    }
    globalForPrisma.prisma = createPrismaClient(env.DATABASE_URL);
  }

  return globalForPrisma.prisma;
}
