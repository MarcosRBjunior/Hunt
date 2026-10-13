import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaProductRepository } from "@/server/repositories/prismaProductRepository";
import { createAdminProductService } from "@/server/services/adminProductService";

import { buildProduct } from "../helpers/buildProduct";
import {
  insertProducts,
  resetDatabase,
  seedTopics,
  testPrisma,
} from "./helpers";

const productRepository = new PrismaProductRepository(testPrisma);
const adminProductService = createAdminProductService({ productRepository });

afterAll(async () => {
  await testPrisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase();
  await seedTopics();
});

describe("adminProductService com Postgres", () => {
  it("TC-11: produto criado com upvotes: 500 no body nasce com 0 votos", async () => {
    const created = await adminProductService.create({
      title: "Layer",
      description: "A API visual.",
      url: "https://layer.example.com",
      topicSlugs: ["saas"],
      upvotes: 500,
      visits: 999,
    });

    const stored = await testPrisma.product.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(stored.upvotes).toBe(0);
    expect(stored.visits).toBe(0);
    expect(created.topics).toEqual([{ slug: "saas", name: "SaaS" }]);
  });

  it("TC-25: visits: 999 no PATCH é ignorado", async () => {
    const product = buildProduct({ visits: 12, upvotes: 3 });
    await insertProducts([product]);

    const updated = await adminProductService.update(product.id, {
      visits: 999,
      upvotes: 999,
      title: "Novo nome",
    });

    expect(updated).toMatchObject({
      title: "Novo nome",
      visits: 12,
      upvotes: 3,
    });
  });

  it("TC-12: url javascript: é recusada antes do banco", async () => {
    const error = await adminProductService
      .create({
        title: "X",
        description: "Y",
        url: "javascript:alert(1)",
      })
      .catch((e) => e);

    expect(error).toMatchObject({ status: 400 });
    expect(error.details.fields).toHaveProperty("url");
    expect(await testPrisma.product.count()).toBe(0);
  });
});
