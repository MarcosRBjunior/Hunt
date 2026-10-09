import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { sortTopicsByName } from "@/lib/topics";

import type {
  Product,
  ProductRepository,
  ReviewedProduct,
} from "./productRepository";

const productInclude = {
  topics: { select: { topic: { select: { slug: true, name: true } } } },
} satisfies Prisma.ProductInclude;

const reviewedProductInclude = {
  ...productInclude,
  review: { select: { rating: true, summary: true } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

type ReviewedProductRow = Prisma.ProductGetPayload<{
  include: typeof reviewedProductInclude;
}>;

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    url: row.url,
    logoUrl: row.logoUrl,
    upvotes: row.upvotes,
    visits: row.visits,
    status: row.status,
    topics: sortTopicsByName(row.topics.map(({ topic }) => topic)),
    createdAt: row.createdAt,
  };
}

function toReviewedProducts(rows: ReviewedProductRow[]): ReviewedProduct[] {
  // O `where` já garante a revisão; o filtro só estreita o tipo.
  return rows.flatMap(({ review, ...row }) =>
    review ? [{ ...toProduct(row), review }] : [],
  );
}

export class PrismaProductRepository implements ProductRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async listLaunched(): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      where: { status: "LAUNCHED" },
      orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
      include: productInclude,
    });

    return rows.map(toProduct);
  }

  async listReviewed(limit: number): Promise<ReviewedProduct[]> {
    const rows = await this.prisma.product.findMany({
      where: { review: { isNot: null } },
      orderBy: [{ review: { rating: "desc" } }, { createdAt: "desc" }],
      take: limit,
      include: reviewedProductInclude,
    });

    return toReviewedProducts(rows);
  }

  async listUpcoming(): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      where: { status: "UPCOMING" },
      orderBy: { createdAt: "desc" },
      include: productInclude,
    });

    return rows.map(toProduct);
  }
}
