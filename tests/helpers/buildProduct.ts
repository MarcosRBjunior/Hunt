import { randomUUID } from "node:crypto";

import type { Product } from "@/server/repositories/productRepository";

export function buildProduct(overrides: Partial<Product> = {}): Product {
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
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}
