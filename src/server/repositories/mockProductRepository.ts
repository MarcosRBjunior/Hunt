import { z } from "zod";

import { sortTopicsByName, TOPIC_SLUGS } from "@/lib/topics";
import { httpUrlSchema } from "@/lib/validation/common";
import rawProducts from "@/mocks/products.json";

import type {
  EditorialReview,
  Product,
  ProductRepository,
  ReviewedProduct,
} from "./productRepository";
import { ReadOnlySourceError } from "./readOnlySource";

// Valida o JSON com as mesmas restrições do banco, para o mock não divergir dele.
const mockProductSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(500),
  url: httpUrlSchema,
  logoUrl: httpUrlSchema.nullable(),
  upvotes: z.int().nonnegative(),
  visits: z.int().nonnegative(),
  status: z.enum(["LAUNCHED", "UPCOMING"]),
  topics: z.array(
    z.object({
      slug: z.enum(TOPIC_SLUGS),
      name: z.string().min(1).max(60),
    }),
  ),
  review: z
    .object({
      rating: z.int().min(1).max(5),
      summary: z.string().max(280).nullable(),
    })
    .nullable(),
  createdAt: z.iso.datetime(),
});

/** Produto do mock com a revisão editorial junto (no banco ela fica em outra tabela). */
export type MockProductRecord = Product & { review: EditorialReview | null };

export function parseMockProducts(raw: unknown): MockProductRecord[] {
  return z
    .array(mockProductSchema)
    .parse(raw)
    .map(({ createdAt, ...product }) => ({
      ...product,
      createdAt: new Date(createdAt),
    }));
}

function newestFirst(a: Product, b: Product): number {
  return b.createdAt.getTime() - a.createdAt.getTime();
}

function toProduct({ review, ...product }: MockProductRecord): Product {
  return { ...product, topics: sortTopicsByName(product.topics) };
}

function hasReview(
  record: MockProductRecord,
): record is MockProductRecord & ReviewedProduct {
  return record.review !== null;
}

export class MockProductRepository implements ProductRepository {
  private readonly records: readonly MockProductRecord[];

  constructor(
    records: readonly MockProductRecord[] = parseMockProducts(rawProducts),
  ) {
    this.records = records;
  }

  async listLaunched(): Promise<Product[]> {
    return this.records
      .filter((record) => record.status === "LAUNCHED")
      .map(toProduct)
      .toSorted((a, b) => b.upvotes - a.upvotes || newestFirst(a, b));
  }

  async listReviewed(limit: number): Promise<ReviewedProduct[]> {
    return this.records
      .filter(hasReview)
      .toSorted(
        (a, b) => b.review.rating - a.review.rating || newestFirst(a, b),
      )
      .slice(0, limit)
      .map((record) => ({ ...toProduct(record), review: record.review }));
  }

  async listUpcoming(): Promise<Product[]> {
    return this.records
      .filter((record) => record.status === "UPCOMING")
      .map(toProduct)
      .toSorted(newestFirst);
  }

  async listAll(): Promise<Product[]> {
    return this.records.map(toProduct).toSorted(newestFirst);
  }

  async findById(id: string): Promise<Product | null> {
    const record = this.records.find((candidate) => candidate.id === id);
    return record ? toProduct(record) : null;
  }

  async create(): Promise<Product> {
    throw new ReadOnlySourceError();
  }

  async update(): Promise<Product | null> {
    throw new ReadOnlySourceError();
  }

  async delete(): Promise<boolean> {
    throw new ReadOnlySourceError();
  }

  async incrementVisits(): Promise<boolean> {
    throw new ReadOnlySourceError();
  }
}
