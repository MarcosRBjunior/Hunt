import { afterAll, describe, expect, it } from "vitest";

import rawProducts from "@/mocks/products.json";
import {
  MockProductRepository,
  parseMockProducts,
} from "@/server/repositories/mockProductRepository";
import { PrismaProductRepository } from "@/server/repositories/prismaProductRepository";

import { describeProductRepositoryContract } from "../helpers/productRepositoryContract";
import { insertProducts, resetDatabase, testPrisma } from "./helpers";

afterAll(async () => {
  await testPrisma.$disconnect();
});

describeProductRepositoryContract(
  "PrismaProductRepository",
  async (products) => {
    await resetDatabase();
    await insertProducts(products);
    return new PrismaProductRepository(testPrisma);
  },
);

describe("PrismaProductRepository com os dados do mock", () => {
  it("devolve exatamente o mesmo que o MockProductRepository (a troca não muda a UI)", async () => {
    const records = parseMockProducts(rawProducts);
    await resetDatabase();
    await insertProducts(records);

    const prisma = new PrismaProductRepository(testPrisma);
    const mock = new MockProductRepository(records);

    expect(await prisma.listLaunched()).toEqual(await mock.listLaunched());
    expect(await prisma.listReviewed(3)).toEqual(await mock.listReviewed(3));
    expect(await prisma.listUpcoming()).toEqual(await mock.listUpcoming());
  });
});
