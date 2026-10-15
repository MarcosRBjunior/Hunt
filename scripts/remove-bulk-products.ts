import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

import { buildBulkProducts } from "../prisma/bulkData";

/**
 * `npm run db:bulk:remove`: apaga os 995 produtos gerados pelo seed com
 * `SEED_BULK=true` (votos e topics vão em cascata) e deixa o banco só com a
 * demo. Só apaga pelos ids do gerador, então não encosta em produto cadastrado
 * pelo admin. Os usuários fictícios ficam: são os mesmos da demo.
 */

loadEnvConfig(process.cwd());

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não definida (veja .env.example)");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });

  try {
    const ids = buildBulkProducts().map((product) => product.id);
    const { count } = await prisma.product.deleteMany({
      where: { id: { in: ids } },
    });

    console.info(`Produtos gerados removidos: ${count}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
