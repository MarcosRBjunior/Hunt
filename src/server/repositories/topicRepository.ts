import type { PrismaClient } from "@/generated/prisma/client";
import { SEED_TOPICS, sortTopicsByName } from "@/lib/topics";
import rawProducts from "@/mocks/products.json";

import {
  type MockProductRecord,
  parseMockProducts,
} from "./mockProductRepository";
import type { Topic } from "./productRepository";

export type TopicWithProductCount = Topic & { productCount: number };

export interface TopicRepository {
  /**
   * Todos os topics, em ordem alfabética pelo nome, cada um com quantos
   * produtos `LAUNCHED` tem: o mesmo que o filtro da lista principal mostra.
   */
  listWithProductCount(): Promise<TopicWithProductCount[]>;
}

export class PrismaTopicRepository implements TopicRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async listWithProductCount(): Promise<TopicWithProductCount[]> {
    const rows = await this.prisma.topic.findMany({
      select: {
        slug: true,
        name: true,
        _count: {
          select: {
            products: { where: { product: { status: "LAUNCHED" } } },
          },
        },
      },
    });

    return sortTopicsByName(
      rows.map(({ slug, name, _count }) => ({
        slug,
        name,
        productCount: _count.products,
      })),
    );
  }
}

/** No mock não há tabela de topics: são os 5 do seed, contados no JSON. */
export class MockTopicRepository implements TopicRepository {
  private readonly records: readonly MockProductRecord[];

  constructor(
    records: readonly MockProductRecord[] = parseMockProducts(rawProducts),
  ) {
    this.records = records;
  }

  async listWithProductCount(): Promise<TopicWithProductCount[]> {
    const launched = this.records.filter(
      (record) => record.status === "LAUNCHED",
    );

    return sortTopicsByName(
      SEED_TOPICS.map(({ slug, name }) => ({
        slug,
        name,
        productCount: launched.filter((record) =>
          record.topics.some((topic) => topic.slug === slug),
        ).length,
      })),
    );
  }
}
