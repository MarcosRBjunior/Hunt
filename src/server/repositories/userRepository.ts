import type { PrismaClient } from "@/generated/prisma/client";

/** Usuário local: só o vínculo com o Clerk (sem nome, e-mail nem avatar). */
export type User = {
  id: string;
  externalId: string;
};

export interface UserRepository {
  /** Cria o usuário na primeira vez e devolve o existente nas outras. */
  upsertByExternalId(externalId: string): Promise<User>;
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
}
