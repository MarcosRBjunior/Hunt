import type { PrismaClient } from "@/generated/prisma/client";

import { isPrismaError } from "./prismaErrors";
import { ReadOnlySourceError } from "./readOnlySource";

export type AddVoteResult =
  | { status: "created"; upvotes: number }
  /** O usuário já tinha votado (UNIQUE `user_id, product_id`). */
  | { status: "duplicate" }
  | { status: "product_not_found" };

export interface VoteRepository {
  /** INSERT do voto + `upvotes + 1`, numa transação (regra 4). */
  add(userId: string, productId: string): Promise<AddVoteResult>;

  /**
   * DELETE do voto + `upvotes - 1` (nunca abaixo de 0), numa transação.
   * `null` se não havia voto.
   */
  remove(
    userId: string,
    productId: string,
  ): Promise<{ upvotes: number } | null>;

  /** Dos produtos informados, em quais o usuário (id do Clerk) votou. */
  votedProductIds(
    externalId: string,
    productIds: readonly string[],
  ): Promise<Set<string>>;
}

export class PrismaVoteRepository implements VoteRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async add(userId: string, productId: string): Promise<AddVoteResult> {
    try {
      // O INSERT vem primeiro: com cliques simultâneos, o UNIQUE barra os
      // repetidos (P2002) e a transação inteira volta, sem somar o voto.
      const [, product] = await this.prisma.$transaction([
        this.prisma.vote.create({ data: { userId, productId } }),
        this.prisma.product.update({
          where: { id: productId },
          data: { upvotes: { increment: 1 } },
          select: { upvotes: true },
        }),
      ]);

      return { status: "created", upvotes: product.upvotes };
    } catch (error) {
      if (isPrismaError(error, "P2002")) return { status: "duplicate" };
      // O serviço já conferiu o produto; aqui só cai se ele foi apagado no meio.
      if (isPrismaError(error, "P2003")) return { status: "product_not_found" };
      throw error;
    }
  }

  async remove(
    userId: string,
    productId: string,
  ): Promise<{ upvotes: number } | null> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.vote.deleteMany({
        where: { userId, productId },
      });
      if (count === 0) return null;

      // Com o contador já divergente (0 com voto existente), fica em 0.
      await tx.product.updateMany({
        where: { id: productId, upvotes: { gt: 0 } },
        data: { upvotes: { decrement: 1 } },
      });
      const product = await tx.product.findUniqueOrThrow({
        where: { id: productId },
        select: { upvotes: true },
      });

      return { upvotes: product.upvotes };
    });
  }

  async votedProductIds(
    externalId: string,
    productIds: readonly string[],
  ): Promise<Set<string>> {
    const votes = await this.prisma.vote.findMany({
      where: { user: { externalId }, productId: { in: [...productIds] } },
      select: { productId: true },
    });

    return new Set(votes.map((vote) => vote.productId));
  }
}

/** Com `PRODUCT_SOURCE=mock` não há votos: ninguém votou e nada grava. */
export class MockVoteRepository implements VoteRepository {
  async add(): Promise<AddVoteResult> {
    throw new ReadOnlySourceError();
  }

  async remove(): Promise<{ upvotes: number } | null> {
    throw new ReadOnlySourceError();
  }

  async votedProductIds(): Promise<Set<string>> {
    return new Set();
  }
}
