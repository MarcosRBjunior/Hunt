import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { SEED_TOPICS } from "@/lib/topics";
import rawProducts from "@/mocks/products.json";
import { parseMockProducts } from "@/server/repositories/mockProductRepository";

import {
  buildDemoVotes,
  demoUserCount,
  demoUserExternalIds,
  isDemoEnabled,
} from "./demoData";

/**
 * Seed idempotente: pode rodar quantas vezes quiser sem duplicar nada.
 *
 * - Sempre: os 5 topics fixos.
 * - Com SEED_DEMO=true: os produtos de `src/mocks/products.json` (mesmos ids),
 *   com topics, revisões, usuários fictícios e votos, e `upvotes = count(votes)`.
 */

loadEnvConfig(process.cwd());

async function seedTopics(tx: Prisma.TransactionClient) {
  const topicIds = new Map<string, string>();

  // Sequencial: a transação usa uma conexão só.
  for (const { slug, name } of SEED_TOPICS) {
    const topic = await tx.topic.upsert({
      where: { slug },
      create: { slug, name },
      update: { name },
    });
    topicIds.set(slug, topic.id);
  }

  return topicIds;
}

async function seedDemo(
  tx: Prisma.TransactionClient,
  topicIds: Map<string, string>,
) {
  const products = parseMockProducts(rawProducts);

  for (const { id, review, topics, upvotes, ...fields } of products) {
    // `upvotes` sai da contagem de votos, no fim.
    await tx.product.upsert({
      where: { id },
      create: { id, ...fields },
      update: fields,
    });

    await tx.productTopic.deleteMany({ where: { productId: id } });
    await tx.productTopic.createMany({
      data: topics.map((topic) => ({
        productId: id,
        topicId: topicIds.get(topic.slug)!,
      })),
    });

    if (review) {
      await tx.editorialReview.upsert({
        where: { productId: id },
        create: { productId: id, ...review },
        update: review,
      });
    } else {
      await tx.editorialReview.deleteMany({ where: { productId: id } });
    }
  }

  const externalIds = demoUserExternalIds(demoUserCount(products));
  await tx.user.createMany({
    data: externalIds.map((externalId) => ({ externalId })),
    skipDuplicates: true,
  });

  const users = await tx.user.findMany({
    where: { externalId: { in: externalIds } },
    select: { id: true, externalId: true },
  });
  const userIds = new Map(users.map((user) => [user.externalId, user.id]));

  await tx.vote.createMany({
    data: buildDemoVotes(products).map(({ externalId, productId }) => ({
      userId: userIds.get(externalId)!,
      productId,
    })),
    skipDuplicates: true,
  });

  for (const { id } of products) {
    const votes = await tx.vote.count({ where: { productId: id } });
    await tx.product.update({ where: { id }, data: { upvotes: votes } });
  }
}

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não definida (veja .env.example)");
  }

  const demo = isDemoEnabled(process.env.SEED_DEMO);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    await prisma.$transaction(
      async (tx) => {
        const topicIds = await seedTopics(tx);
        if (demo) await seedDemo(tx, topicIds);
      },
      { timeout: 60_000 },
    );

    const [topics, products, users, votes, reviews] = await Promise.all([
      prisma.topic.count(),
      prisma.product.count(),
      prisma.user.count(),
      prisma.vote.count(),
      prisma.editorialReview.count(),
    ]);
    console.info(
      `Seed ok (demo: ${demo ? "sim" : "não"}): ${topics} topics, ${products} produtos, ` +
        `${users} usuários, ${votes} votos, ${reviews} revisões`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
