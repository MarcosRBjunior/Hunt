import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { SEED_TOPICS } from "@/lib/topics";
import rawProducts from "@/mocks/products.json";
import {
  parseMockProducts,
  type MockProductRecord,
} from "@/server/repositories/mockProductRepository";

import { buildBulkProducts } from "./bulkData";
import {
  buildDemoVotes,
  demoUserCount,
  demoUserExternalIds,
  parseSeedOptions,
} from "./demoData";

/**
 * Seed idempotente: pode rodar quantas vezes quiser sem duplicar nada.
 *
 * - Sempre: os 5 topics fixos.
 * - Com SEED_DEMO=true: os produtos de `src/mocks/products.json` (mesmos ids),
 *   com topics, revisões, usuários fictícios e votos, e `upvotes = count(votes)`.
 * - Com SEED_BULK=true (e SEED_DEMO=true): mais 995 produtos gerados
 *   (`prisma/bulkData.ts`), com votos, para medir o desempenho com 1.000.
 */

loadEnvConfig(process.cwd());

/** Linhas por `createMany`: bem abaixo do limite de parâmetros do Postgres. */
const INSERT_BATCH_SIZE = 5_000;

function chunk<T>(items: readonly T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
}

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

/**
 * Produtos gerados, em lote (um upsert por produto seria lento num banco
 * remoto). Só cria o que falta: rodar de novo não duplica nada. Para gerar de
 * novo depois de mudar o gerador, rode `npm run db:bulk:remove` antes.
 */
async function seedBulk(
  tx: Prisma.TransactionClient,
  products: readonly MockProductRecord[],
  topicIds: Map<string, string>,
) {
  // `upvotes` sai da contagem de votos, no fim; não há revisões.
  await tx.product.createMany({
    data: products.map(({ review, topics, upvotes, ...fields }) => fields),
    skipDuplicates: true,
  });

  await tx.productTopic.createMany({
    data: products.flatMap(({ id, topics }) =>
      topics.map((topic) => ({
        productId: id,
        topicId: topicIds.get(topic.slug)!,
      })),
    ),
    skipDuplicates: true,
  });
}

async function seedDemo(
  tx: Prisma.TransactionClient,
  topicIds: Map<string, string>,
  bulk: boolean,
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

  const generated = bulk ? buildBulkProducts() : [];
  if (generated.length > 0) await seedBulk(tx, generated, topicIds);

  const all = [...products, ...generated];
  const externalIds = demoUserExternalIds(demoUserCount(all));
  await tx.user.createMany({
    data: externalIds.map((externalId) => ({ externalId })),
    skipDuplicates: true,
  });

  const users = await tx.user.findMany({
    where: { externalId: { in: externalIds } },
    select: { id: true, externalId: true },
  });
  const userIds = new Map(users.map((user) => [user.externalId, user.id]));

  const votes = buildDemoVotes(all).map(({ externalId, productId }) => ({
    userId: userIds.get(externalId)!,
    productId,
  }));
  for (const batch of chunk(votes, INSERT_BATCH_SIZE)) {
    await tx.vote.createMany({ data: batch, skipDuplicates: true });
  }

  // `upvotes = count(votes)` (regra 14), numa query só para todos os produtos.
  const ids = all.map((product) => product.id);
  await tx.$executeRaw`
    UPDATE products AS p
    SET upvotes = counted.total, updated_at = now()
    FROM (
      SELECT products.id, count(votes.id)::int AS total
      FROM products
      LEFT JOIN votes ON votes.product_id = products.id
      WHERE products.id = ANY(${ids}::uuid[])
      GROUP BY products.id
    ) AS counted
    WHERE p.id = counted.id AND p.upvotes <> counted.total`;
}

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não definida (veja .env.example)");
  }

  const { demo, bulk } = parseSeedOptions(process.env);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    await prisma.$transaction(
      async (tx) => {
        const topicIds = await seedTopics(tx);
        if (demo) await seedDemo(tx, topicIds, bulk);
      },
      // maxWait: abrir a 1ª conexão num banco remoto (SSL) passa dos 2 s padrão.
      // timeout: com SEED_BULK, são dezenas de milhares de votos.
      { maxWait: 15_000, timeout: 120_000 },
    );

    const [topics, products, users, votes, reviews] = await Promise.all([
      prisma.topic.count(),
      prisma.product.count(),
      prisma.user.count(),
      prisma.vote.count(),
      prisma.editorialReview.count(),
    ]);
    console.info(
      `Seed ok (demo: ${demo ? "sim" : "não"}, gerados: ${bulk ? "sim" : "não"}): ` +
        `${topics} topics, ${products} produtos, ` +
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
