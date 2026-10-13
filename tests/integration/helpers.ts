import { SEED_TOPICS } from "@/lib/topics";
import { createPrismaClient } from "@/server/db";

import type { ProductFixture } from "../helpers/buildProduct";
import { TEST_DATABASE_URL } from "./testDatabase";

export const testPrisma = createPrismaClient(TEST_DATABASE_URL);

export async function resetDatabase() {
  await testPrisma.$executeRaw`TRUNCATE TABLE votes, product_topics, editorial_reviews, products, users, topics RESTART IDENTITY CASCADE`;
}

/** Os 5 topics fixos, como o seed (o admin só associa topics existentes). */
export async function seedTopics() {
  await testPrisma.topic.createMany({
    data: [...SEED_TOPICS],
    skipDuplicates: true,
  });
}

/** Cria usuários fictícios e um voto de cada um no produto (sem mexer em `upvotes`). */
export async function insertVoters(productId: string, count: number) {
  const users = [];
  for (let index = 0; index < count; index++) {
    const user = await testPrisma.user.create({
      data: { externalId: `voter_${productId}_${index}` },
    });
    await testPrisma.vote.create({ data: { userId: user.id, productId } });
    users.push(user);
  }
  return users;
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
