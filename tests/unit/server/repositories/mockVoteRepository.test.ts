import { describe, expect, it } from "vitest";

import {
  MockVoteRepository,
  type VoteRepository,
} from "@/server/repositories/voteRepository";

const userId = "11111111-1111-4111-8111-111111111111";
const productId = "a59e45f4-7972-4bf3-ae41-0d6136c45f8c";

describe("MockVoteRepository (PRODUCT_SOURCE=mock)", () => {
  const repository: VoteRepository = new MockVoteRepository();

  it("ninguém votou em nada: viewerHasVoted fica sempre false", async () => {
    expect((await repository.votedProductIds("user_1", [productId])).size).toBe(
      0,
    );
  });

  it.each([
    ["add", () => repository.add(userId, productId)],
    ["remove", () => repository.remove(userId, productId)],
  ])("%s falha avisando para usar PRODUCT_SOURCE=prisma", async (_, write) => {
    await expect(write()).rejects.toThrow("PRODUCT_SOURCE=prisma");
  });
});
