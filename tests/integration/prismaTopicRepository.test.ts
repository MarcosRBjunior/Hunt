import { afterAll, describe, expect, it } from "vitest";

import rawProducts from "@/mocks/products.json";
import { parseMockProducts } from "@/server/repositories/mockProductRepository";
import {
  MockTopicRepository,
  PrismaTopicRepository,
} from "@/server/repositories/topicRepository";

import { describeTopicRepositoryContract } from "../helpers/topicRepositoryContract";
import {
  insertProducts,
  resetDatabase,
  seedTopics,
  testPrisma,
} from "./helpers";

afterAll(async () => {
  await testPrisma.$disconnect();
});

describeTopicRepositoryContract("PrismaTopicRepository", async (products) => {
  await resetDatabase();
  await seedTopics();
  await insertProducts(products);
  return new PrismaTopicRepository(testPrisma);
});

describe("PrismaTopicRepository com os dados do mock", () => {
  it("devolve exatamente o mesmo que o MockTopicRepository", async () => {
    const records = parseMockProducts(rawProducts);
    await resetDatabase();
    await seedTopics();
    await insertProducts(records);

    expect(
      await new PrismaTopicRepository(testPrisma).listWithProductCount(),
    ).toEqual(await new MockTopicRepository(records).listWithProductCount());
  });
});
