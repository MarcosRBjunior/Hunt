import { z } from "zod";

import rawProducts from "@/mocks/products.json";

import type { Product, ProductRepository } from "./productRepository";

const httpUrl = z.url({ protocol: /^https?$/, hostname: z.regexes.domain });

// Valida o JSON com as mesmas restrições do banco, para o mock não divergir dele.
const mockProductSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(500),
  url: httpUrl,
  logoUrl: httpUrl.nullable(),
  upvotes: z.int().nonnegative(),
  visits: z.int().nonnegative(),
  status: z.enum(["LAUNCHED", "UPCOMING"]),
  topics: z.array(
    z.object({
      slug: z.enum(["ia", "produtividade", "marketing", "saas", "tech"]),
      name: z.string().min(1).max(60),
    }),
  ),
  // Lido pela lateral "Produtos revisados por nós" a partir da Fase 3.
  review: z
    .object({
      rating: z.int().min(1).max(5),
      summary: z.string().max(280).nullable(),
    })
    .nullable(),
  createdAt: z.iso.datetime(),
});

export function parseMockProducts(raw: unknown): Product[] {
  return z
    .array(mockProductSchema)
    .parse(raw)
    .map(({ review, createdAt, ...product }) => ({
      ...product,
      createdAt: new Date(createdAt),
    }));
}

function byRanking(a: Product, b: Product): number {
  return b.upvotes - a.upvotes || b.createdAt.getTime() - a.createdAt.getTime();
}

export class MockProductRepository implements ProductRepository {
  private readonly products: readonly Product[];

  constructor(products: readonly Product[] = parseMockProducts(rawProducts)) {
    this.products = products;
  }

  async listLaunched(): Promise<Product[]> {
    return this.products
      .filter((product) => product.status === "LAUNCHED")
      .toSorted(byRanking);
  }
}
