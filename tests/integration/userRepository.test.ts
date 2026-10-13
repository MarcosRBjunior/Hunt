import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaUserRepository } from "@/server/repositories/userRepository";
import { PrismaVoteRepository } from "@/server/repositories/voteRepository";

import { resetDatabase, testPrisma } from "./helpers";

afterAll(async () => {
  await testPrisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase();
});

describe("PrismaUserRepository.upsertByExternalId", () => {
  const repository = new PrismaUserRepository(() => testPrisma);

  it("TC-15: a primeira ação autenticada repetida 2 vezes cria 1 único User", async () => {
    const first = await repository.upsertByExternalId("user_clerk_1");
    const second = await repository.upsertByExternalId("user_clerk_1");

    expect(second).toEqual(first);
    expect(await testPrisma.user.count()).toBe(1);
  });

  it("TC-15: 50 chamadas simultâneas do mesmo usuário também criam 1 só, sem erro", async () => {
    // 10 não bastava: o `upsert` do Prisma passava com 10 e falhava com 50.
    for (let round = 0; round < 3; round++) {
      const externalId = `user_concorrente_${round}`;

      const results = await Promise.all(
        Array.from({ length: 50 }, () =>
          repository.upsertByExternalId(externalId),
        ),
      );

      expect(new Set(results.map((user) => user.id)).size).toBe(1);
      expect(await testPrisma.user.count({ where: { externalId } })).toBe(1);
    }
  });

  it("cria um User por external_id diferente", async () => {
    await repository.upsertByExternalId("user_a");
    await repository.upsertByExternalId("user_b");

    expect(await testPrisma.user.count()).toBe(2);
  });
});

describe("PrismaUserRepository.deleteByExternalId", () => {
  const repository = new PrismaUserRepository(() => testPrisma);

  async function productWith(upvotes: number) {
    return testPrisma.product.create({
      data: {
        title: `Produto ${upvotes}`,
        description: "Descrição.",
        url: "https://example.com",
        upvotes,
      },
    });
  }

  async function upvotesOf(id: string) {
    const product = await testPrisma.product.findUniqueOrThrow({
      where: { id },
    });
    return product.upvotes;
  }

  it("TC-27: usuário com 2 votos é apagado e os 2 produtos descem 1 cada", async () => {
    const [a, b, untouched] = await Promise.all([
      productWith(10),
      productWith(5),
      productWith(7),
    ]);
    const user = await repository.upsertByExternalId("user_que_sai");
    const other = await repository.upsertByExternalId("user_que_fica");
    await testPrisma.vote.createMany({
      data: [
        { userId: user.id, productId: a.id },
        { userId: user.id, productId: b.id },
        { userId: other.id, productId: a.id },
      ],
    });

    const result = await repository.deleteByExternalId("user_que_sai");

    expect(result).toEqual({ votesRemoved: 2 });
    expect([
      await upvotesOf(a.id),
      await upvotesOf(b.id),
      await upvotesOf(untouched.id),
    ]).toEqual([9, 4, 7]);
    expect(
      await testPrisma.user.count({ where: { externalId: "user_que_sai" } }),
    ).toBe(0);
    expect(await testPrisma.vote.count({ where: { userId: user.id } })).toBe(0);
    // O voto do outro usuário continua.
    expect(await testPrisma.vote.count()).toBe(1);
  });

  it("evento repetido: usuário que não existe devolve null e não muda nada", async () => {
    const product = await productWith(3);

    expect(await repository.deleteByExternalId("user_inexistente")).toBeNull();
    expect(await upvotesOf(product.id)).toBe(3);
  });

  it("usuário sem votos é apagado sem mexer nos produtos", async () => {
    const product = await productWith(3);
    await repository.upsertByExternalId("user_sem_votos");

    expect(await repository.deleteByExternalId("user_sem_votos")).toEqual({
      votesRemoved: 0,
    });
    expect(await upvotesOf(product.id)).toBe(3);
    expect(await testPrisma.user.count()).toBe(0);
  });

  it("voto chegando durante a remoção não escapa do desconto", async () => {
    const votes = new PrismaVoteRepository(testPrisma);

    for (let round = 0; round < 10; round++) {
      const products = await Promise.all([productWith(0), productWith(0)]);
      const externalId = `user_corrida_${round}`;
      const user = await repository.upsertByExternalId(externalId);
      await votes.add(user.id, products[0].id);

      // Voto novo e remoção ao mesmo tempo: o voto pode entrar antes (e ser
      // descontado) ou falhar (usuário já apagado), nunca sobrar no contador.
      await Promise.allSettled([
        votes.add(user.id, products[1].id),
        repository.deleteByExternalId(externalId),
      ]);

      for (const product of products) {
        expect(await upvotesOf(product.id)).toBe(
          await testPrisma.vote.count({ where: { productId: product.id } }),
        );
      }
    }
  });

  it("contador já divergente (0 com voto) fica em 0, nunca negativo", async () => {
    const product = await productWith(0);
    const user = await repository.upsertByExternalId("user_divergente");
    await testPrisma.vote.create({
      data: { userId: user.id, productId: product.id },
    });

    await repository.deleteByExternalId("user_divergente");

    expect(await upvotesOf(product.id)).toBe(0);
  });
});
