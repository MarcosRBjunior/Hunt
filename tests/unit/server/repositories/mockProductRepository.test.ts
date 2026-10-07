import { describe, expect, it } from "vitest";

import {
  MockProductRepository,
  parseMockProducts,
} from "@/server/repositories/mockProductRepository";
import { describeProductRepositoryContract } from "./productRepository.contract";

describeProductRepositoryContract(
  "MockProductRepository",
  async (products) => new MockProductRepository(products),
);

describe("MockProductRepository com src/mocks/products.json", () => {
  it("traz os 4 produtos lançados do wireframe, em ordem", async () => {
    const products = await new MockProductRepository().listLaunched();

    expect(products.map(({ title, upvotes }) => ({ title, upvotes }))).toEqual([
      { title: "Milo AI", upvotes: 298 },
      { title: "Layer", upvotes: 202 },
      { title: "Sunnie", upvotes: 102 },
      { title: "Orbit", upvotes: 29 },
    ]);
  });

  it("traz Layer e Milo AI como revisados (5/5) e zwelie em breve", async () => {
    const repository = new MockProductRepository();

    const reviewed = await repository.listReviewed(3);
    const upcoming = await repository.listUpcoming();

    expect(reviewed.map(({ title, review }) => [title, review.rating])).toEqual(
      [
        ["Layer", 5],
        ["Milo AI", 5],
      ],
    );
    expect(upcoming.map((product) => product.title)).toEqual(["zwelie"]);
  });
});

describe("parseMockProducts", () => {
  const valid = {
    id: "3298e163-2386-4262-aef9-111f686559a3",
    title: "Produto",
    description: "Descrição.",
    url: "https://example.com",
    logoUrl: null,
    upvotes: 1,
    visits: 0,
    status: "LAUNCHED",
    topics: [{ slug: "saas", name: "SaaS" }],
    review: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  it("converte createdAt para Date", () => {
    expect(parseMockProducts([valid])[0]?.createdAt).toEqual(
      new Date("2026-01-01T00:00:00.000Z"),
    );
  });

  it.each([
    ["url com javascript:", { url: "javascript:alert(1)" }],
    ["upvotes negativo", { upvotes: -1 }],
    ["topic fora dos 5 do seed", { topics: [{ slug: "api", name: "API" }] }],
    ["nota fora de 1 a 5", { review: { rating: 6, summary: null } }],
  ])("rejeita %s", (_, override) => {
    expect(() => parseMockProducts([{ ...valid, ...override }])).toThrow();
  });
});
