import { createPrismaClient } from "@/server/db";

import type { ProductFixture } from "../helpers/buildProduct";
import { TEST_DATABASE_URL } from "./testDatabase";

export const testPrisma = createPrismaClient(TEST_DATABASE_URL);

export async function resetDatabase() {
  await testPrisma.$executeRaw`TRUNCATE TABLE votes, product_topics, editorial_reviews, products, users, topics RESTART IDENTITY CASCADE`;
}

/** Grava os produtos de teste com topics e revisão, como o seed faria. */
export async function insertProducts(products: readonly ProductFixture[]) {
  for (const { review, topics, ...product } of products) {
    await testPrisma.product.create({
      data: {
        ...product,
        topics: {
          create: topics.map(({ slug, name }) => ({
            topic: {
              connectOrCreate: { where: { slug }, create: { slug, name } },
            },
          })),
        },
        ...(review && { review: { create: review } }),
      },
    });
  }
}
