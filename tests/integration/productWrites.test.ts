import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaProductRepository } from "@/server/repositories/prismaProductRepository";

import { buildProduct } from "../helpers/buildProduct";
import {
  insertProducts,
  insertVoters,
  resetDatabase,
  seedTopics,
  testPrisma,
} from "./helpers";

const repository = new PrismaProductRepository(testPrisma);
const missingId = "00000000-0000-4000-8000-000000000000";

const newProduct = {
  title: "Layer",
  description: "A API visual que conecta suas ferramentas.",
  url: "https://layer.example.com",
  logoUrl: "https://layer.example.com/logo.png",
  status: "LAUNCHED" as const,
  topicSlugs: ["tech" as const, "saas" as const],
};

afterAll(async () => {
  await testPrisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase();
  await seedTopics();
});

describe("PrismaProductRepository.create", () => {
  it("grava o produto com 0 votos, 0 visitas e os topics informados", async () => {
    const created = await repository.create(newProduct);

    expect(created).toMatchObject({
      title: "Layer",
      description: "A API visual que conecta suas ferramentas.",
      url: "https://layer.example.com",
      logoUrl: "https://layer.example.com/logo.png",
      status: "LAUNCHED",
      upvotes: 0,
      visits: 0,
      topics: [
        { slug: "saas", name: "SaaS" },
        { slug: "tech", name: "Tech" },
      ],
    });
    expect(await repository.findById(created.id)).toEqual(created);
  });
});

describe("PrismaProductRepository.update", () => {
  it("muda só os campos enviados", async () => {
    const created = await repository.create(newProduct);

    const updated = await repository.update(created.id, {
      title: "Layer 2",
      status: "UPCOMING",
    });

    expect(updated).toMatchObject({
      title: "Layer 2",
      status: "UPCOMING",
      description: newProduct.description,
      url: newProduct.url,
      logoUrl: newProduct.logoUrl,
      topics: created.topics,
    });
  });

  it("topicSlugs substitui a lista inteira", async () => {
    const created = await repository.create(newProduct);

    const updated = await repository.update(created.id, {
      topicSlugs: ["ia", "marketing"],
    });

    expect(updated?.topics.map((topic) => topic.slug)).toEqual([
      "ia",
      "marketing",
    ]);
    expect(
      await testPrisma.productTopic.count({ where: { productId: created.id } }),
    ).toBe(2);
  });

  it("topicSlugs vazio tira todos os topics; logoUrl null tira o logo", async () => {
    const created = await repository.create(newProduct);

    const updated = await repository.update(created.id, {
      topicSlugs: [],
      logoUrl: null,
    });

    expect(updated?.topics).toEqual([]);
    expect(updated?.logoUrl).toBeNull();
  });

  it("não mexe em votos nem visitas", async () => {
    const product = buildProduct({ upvotes: 7, visits: 30 });
    await insertProducts([product]);

    const updated = await repository.update(product.id, { title: "Novo" });

    expect(updated).toMatchObject({ upvotes: 7, visits: 30 });
  });

  it("devolve null para id inexistente", async () => {
    expect(await repository.update(missingId, { title: "X" })).toBeNull();
  });
});

describe("PrismaProductRepository.delete", () => {
  it("TC-17: apaga em cascata votos, topics e revisão, sem apagar usuários nem outros produtos", async () => {
    const removed = buildProduct({
      title: "Removido",
      review: { rating: 4, summary: "Bom." },
      topics: [
        { slug: "saas", name: "SaaS" },
        { slug: "tech", name: "Tech" },
      ],
    });
    const kept = buildProduct({
      title: "Mantido",
      review: { rating: 5, summary: null },
    });
    await insertProducts([removed, kept]);
    const voters = await insertVoters(removed.id, 3);
    for (const voter of voters) {
      await testPrisma.vote.create({
        data: { userId: voter.id, productId: kept.id },
      });
    }

    expect(await repository.delete(removed.id)).toBe(true);

    expect(
      await testPrisma.product.findUnique({ where: { id: removed.id } }),
    ).toBeNull();
    expect(
      await testPrisma.vote.count({ where: { productId: removed.id } }),
    ).toBe(0);
    expect(
      await testPrisma.productTopic.count({ where: { productId: removed.id } }),
    ).toBe(0);
    expect(
      await testPrisma.editorialReview.count({
        where: { productId: removed.id },
      }),
    ).toBe(0);
    expect(await testPrisma.user.count()).toBe(3);
    expect(await testPrisma.vote.count({ where: { productId: kept.id } })).toBe(
      3,
    );
    expect(await testPrisma.topic.count()).toBe(5);
  });

  it("devolve false para id inexistente", async () => {
    expect(await repository.delete(missingId)).toBe(false);
  });
});

describe("PrismaProductRepository.incrementVisits", () => {
  it("TC-22: 3 cliques somam 3 visitas, sem deduplicar", async () => {
    const product = buildProduct({ visits: 10 });
    await insertProducts([product]);

    for (let click = 0; click < 3; click++) {
      expect(await repository.incrementVisits(product.id)).toBe(true);
    }

    expect((await repository.findById(product.id))?.visits).toBe(13);
  });

  it("conta cliques simultâneos sem perder nenhum", async () => {
    const product = buildProduct();
    await insertProducts([product]);

    await Promise.all(
      Array.from({ length: 20 }, () => repository.incrementVisits(product.id)),
    );

    expect((await repository.findById(product.id))?.visits).toBe(20);
  });

  it("TC-23: mais visitas e menos votos continua abaixo do mais votado", async () => {
    const voted = buildProduct({ title: "Mais votado", upvotes: 10 });
    const visited = buildProduct({ title: "Mais visitado", upvotes: 5 });
    await insertProducts([voted, visited]);

    for (let click = 0; click < 50; click++) {
      await repository.incrementVisits(visited.id);
    }

    const list = await repository.listLaunched();
    expect(list.map(({ title, visits }) => [title, visits])).toEqual([
      ["Mais votado", 0],
      ["Mais visitado", 50],
    ]);
  });

  it("TC-24: devolve false para produto inexistente", async () => {
    expect(await repository.incrementVisits(missingId)).toBe(false);
  });
});
