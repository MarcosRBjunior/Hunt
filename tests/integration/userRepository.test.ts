import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaUserRepository } from "@/server/repositories/userRepository";

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
