import type { PrismaClient } from "@/generated/prisma/client";

/** Usuário local: só o vínculo com o Clerk (sem nome, e-mail nem avatar). */
export type User = {
  id: string;
  externalId: string;
};

export interface UserRepository {
  /** Cria o usuário na primeira vez e devolve o existente nas outras. */
  upsertByExternalId(externalId: string): Promise<User>;

  /**
   * Apaga o usuário e, na mesma transação, desconta os votos dele de
   * `upvotes` (regra 11). `null` se ele não existe (nada muda).
   */
  deleteByExternalId(
    externalId: string,
  ): Promise<{ votesRemoved: number } | null>;
}

export class PrismaUserRepository implements UserRepository {
  // Função em vez do client: o Prisma só é criado quando um usuário é usado,
  // então importar este módulo não exige DATABASE_URL (PRODUCT_SOURCE=mock).
  private readonly getPrisma: () => PrismaClient;

  constructor(getPrisma: () => PrismaClient) {
    this.getPrisma = getPrisma;
  }

  async upsertByExternalId(externalId: string): Promise<User> {
    const prisma = this.getPrisma();

    // `upsert` do Prisma faz SELECT e depois INSERT: com cliques simultâneos,
    // dois INSERTs colidem no UNIQUE (P2002). `skipDuplicates` vira
    // `INSERT ... ON CONFLICT DO NOTHING`, que nunca falha por duplicata.
    await prisma.user.createMany({
      data: { externalId },
      skipDuplicates: true,
    });

    return prisma.user.findUniqueOrThrow({
      where: { externalId },
      select: { id: true, externalId: true },
    });
  }

  async deleteByExternalId(
    externalId: string,
  ): Promise<{ votesRemoved: number } | null> {
    return this.getPrisma().$transaction(async (tx) => {
      // Trava o usuário: um voto dele que chegue agora espera esta transação
      // (a FK do voto precisa da linha) e não escapa do desconto.
      const [user] = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM users WHERE external_id = ${externalId} FOR UPDATE`;
      if (!user) return null;

      // Um voto por produto (UNIQUE): cada produto votado desce 1, sem ficar
      // negativo mesmo com o contador divergente.
      const votesRemoved = await tx.$executeRaw`
        UPDATE products
        SET upvotes = GREATEST(upvotes - 1, 0), updated_at = now()
        FROM votes
        WHERE votes.product_id = products.id AND votes.user_id = ${user.id}::uuid`;

      // Os votos vão junto pela FK com ON DELETE CASCADE.
      await tx.user.delete({ where: { id: user.id } });

      return { votesRemoved };
    });
  }
}
