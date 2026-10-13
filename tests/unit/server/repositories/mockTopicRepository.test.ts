import { describe, expect, it } from "vitest";

import { MockTopicRepository } from "@/server/repositories/topicRepository";
import { describeTopicRepositoryContract } from "../../../helpers/topicRepositoryContract";

describeTopicRepositoryContract(
  "MockTopicRepository",
  async (products) => new MockTopicRepository(products),
);

describe("MockTopicRepository com src/mocks/products.json", () => {
  it("conta os 4 produtos lançados do wireframe (zwelie, em breve, fica fora)", async () => {
    const topics = await new MockTopicRepository().listWithProductCount();

    expect(
      topics.map(({ slug, productCount }) => [slug, productCount]),
    ).toEqual([
      ["ia", 1],
      ["marketing", 1],
      ["produtividade", 2],
      ["saas", 3],
      ["tech", 1],
    ]);
  });
});
