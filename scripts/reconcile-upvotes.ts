import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { reconcileUpvotes } from "@/server/repositories/upvotesReconciliation";

/**
 * `npm run db:reconcile`: acerta `upvotes = count(votes)` no banco da
 * `DATABASE_URL` (ou `DIRECT_URL`, com pooler). Pode rodar quantas vezes
 * quiser; só mexe nos produtos que divergiram.
 */

loadEnvConfig(process.cwd());

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não definida (veja .env.example)");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });

  try {
    const fixed = await reconcileUpvotes(prisma);

    console.info(
      fixed.length === 0
        ? "Reconciliação ok: nenhum produto divergente."
        : `Reconciliação ok: ${fixed.length} produto(s) corrigido(s).`,
    );
    for (const { id, upvotes } of fixed) {
      console.info(`  ${id} → upvotes = ${upvotes}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
