import type { MockProductRecord } from "@/server/repositories/mockProductRepository";

/** Prefixo dos usuários fictícios da demo (não existem no Clerk). */
export const DEMO_USER_PREFIX = "seed_demo_user_";

export type DemoVote = {
  externalId: string;
  productId: string;
};

/** Liga/desliga do seed: "true" liga; vazio, ausente ou "false" desliga. */
function parseSeedFlag(name: string, value: string | undefined): boolean {
  if (value === undefined || value === "" || value === "false") return false;
  if (value === "true") return true;

  throw new Error(`${name} deve ser "true" ou "false" (recebido: "${value}")`);
}

/** `SEED_DEMO`: "true" liga a demo; vazio, ausente ou "false" desliga. */
export function isDemoEnabled(value: string | undefined): boolean {
  return parseSeedFlag("SEED_DEMO", value);
}

export type SeedOptions = {
  /** Produtos de `src/mocks/products.json`, com usuários e votos fictícios. */
  demo: boolean;
  /** Mais 995 produtos gerados (prisma/bulkData.ts), para medir desempenho. */
  bulk: boolean;
};

/** `SEED_BULK=true` completa a demo até 1.000 produtos: sem a demo, é erro. */
export function parseSeedOptions(
  env: Record<string, string | undefined>,
): SeedOptions {
  const demo = isDemoEnabled(env.SEED_DEMO);
  const bulk = parseSeedFlag("SEED_BULK", env.SEED_BULK);

  if (bulk && !demo) {
    throw new Error("SEED_BULK=true exige SEED_DEMO=true (completa a demo)");
  }
  return { demo, bulk };
}

/** Ids externos determinísticos (`seed_demo_user_0001`, ...), para o seed ser idempotente. */
export function demoUserExternalIds(count: number): string[] {
  return Array.from(
    { length: count },
    (_, index) => `${DEMO_USER_PREFIX}${String(index + 1).padStart(4, "0")}`,
  );
}

/** Quantos usuários fictícios bastam: um por voto do produto mais votado. */
export function demoUserCount(products: readonly MockProductRecord[]): number {
  return Math.max(0, ...products.map((product) => product.upvotes));
}

/**
 * Cada produto recebe `upvotes` votos, dos primeiros usuários fictícios, para
 * manter `upvotes = count(votes)` (CLAUDE.md › Regras de negócio, 14).
 */
export function buildDemoVotes(
  products: readonly MockProductRecord[],
): DemoVote[] {
  const externalIds = demoUserExternalIds(demoUserCount(products));

  return products.flatMap((product) => {
    // Produto UPCOMING não recebe voto (regra 5).
    if (product.status === "UPCOMING" && product.upvotes > 0) {
      throw new Error(
        `Produto UPCOMING não pode ter votos na demo: ${product.title}`,
      );
    }

    return externalIds
      .slice(0, product.upvotes)
      .map((externalId) => ({ externalId, productId: product.id }));
  });
}
