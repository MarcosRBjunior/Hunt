import { randomUUID } from "node:crypto";

import type {
  EditorialReview,
  Product,
} from "@/server/repositories/productRepository";

/** Produto de teste, com a revisão editorial opcional (tabela à parte no banco). */
export type ProductFixture = Product & { review: EditorialReview | null };

export function buildProduct(
  overrides: Partial<ProductFixture> = {},
): ProductFixture {
  return {
    id: randomUUID(),
    title: "Produto de teste",
    description: "Descrição do produto de teste.",
    url: "https://example.com",
    logoUrl: null,
    upvotes: 0,
    visits: 0,
    status: "LAUNCHED",
    topics: [{ slug: "tech", name: "Tech" }],
    review: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}
