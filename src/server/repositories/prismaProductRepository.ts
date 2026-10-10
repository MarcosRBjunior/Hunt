import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { sortTopicsByName, type TopicSlug } from "@/lib/topics";

import { isPrismaError } from "./prismaErrors";
import type {
  NewProduct,
  Product,
  ProductChanges,
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

/** Liga o produto aos topics do seed pelo slug. */
function connectTopics(slugs: readonly TopicSlug[]) {
  return slugs.map((slug) => ({ topic: { connect: { slug } } }));
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

  async listAll(): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: productInclude,
    });

    return rows.map(toProduct);
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });

    return row ? toProduct(row) : null;
  }

  async create({ topicSlugs, ...fields }: NewProduct): Promise<Product> {
    const row = await this.prisma.product.create({
      data: { ...fields, topics: { create: connectTopics(topicSlugs) } },
      include: productInclude,
    });

    return toProduct(row);
  }

  async update(
    id: string,
    { topicSlugs, ...fields }: ProductChanges,
  ): Promise<Product | null> {
    try {
      const row = await this.prisma.product.update({
        where: { id },
        data: {
          ...fields,
          // Escrita aninhada: apagar e recriar os vínculos é uma transação só.
          ...(topicSlugs && {
            topics: { deleteMany: {}, create: connectTopics(topicSlugs) },
          }),
        },
        include: productInclude,
      });

      return toProduct(row);
    } catch (error) {
      if (isPrismaError(error, "P2025")) return null;
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    // As FKs com ON DELETE CASCADE levam votos, topics e revisão junto.
    const { count } = await this.prisma.product.deleteMany({ where: { id } });
    return count > 0;
  }

  async incrementVisits(id: string): Promise<boolean> {
    // `visits = visits + 1` no próprio UPDATE: cliques simultâneos não se perdem.
    const { count } = await this.prisma.product.updateMany({
      where: { id },
      data: { visits: { increment: 1 } },
    });
    return count > 0;
  }
}
