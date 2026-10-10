import type { PrismaClient } from "@/generated/prisma/client";

export type ReconciledProduct = { id: string; upvotes: number };

/**
 * Acerta `upvotes = count(votes)` nos produtos que divergiram e devolve quais
 * mudaram. Usado por `npm run db:reconcile` (scripts/reconcile-upvotes.ts).
 */
export async function reconcileUpvotes(
  prisma: PrismaClient,
): Promise<ReconciledProduct[]> {
  return prisma.$transaction(async (tx) => {
    // Segura votos novos até o fim: sem isso, um voto gravado durante a
    // contagem seria sobrescrito pelo total antigo.
    await tx.$executeRaw`LOCK TABLE votes IN SHARE MODE`;

    return tx.$queryRaw<ReconciledProduct[]>`
      UPDATE products AS p
      SET upvotes = counted.total, updated_at = now()
      FROM (
        SELECT products.id, count(votes.id)::int AS total
        FROM products
        LEFT JOIN votes ON votes.product_id = products.id
        GROUP BY products.id
      ) AS counted
      WHERE p.id = counted.id AND p.upvotes <> counted.total
      RETURNING p.id, p.upvotes`;
  });
}
