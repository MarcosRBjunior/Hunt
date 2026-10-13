import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaVoteRepository } from "@/server/repositories/voteRepository";

import { buildProduct } from "../helpers/buildProduct";
import {
  insertProducts,
  insertVoters,
  resetDatabase,
  testPrisma,
} from "./helpers";

const repository = new PrismaVoteRepository(testPrisma);

afterAll(async () => {
  await testPrisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase();
});

async function upvotesOf(productId: string) {
  const product = await testPrisma.product.findUniqueOrThrow({
    where: { id: productId },
  });
  return product.upvotes;
}

describe("PrismaVoteRepository.add", () => {
  it("grava o voto e soma 1 em upvotes, devolvendo o novo total", async () => {
    const product = buildProduct({ upvotes: 4 });
    await insertProducts([product]);
    const user = await testPrisma.user.create({ data: { externalId: "u1" } });

    const result = await repository.add(user.id, product.id);

    expect(result).toEqual({ status: "created", upvotes: 5 });
    expect(await upvotesOf(product.id)).toBe(5);
    expect(await testPrisma.vote.count()).toBe(1);
  });

  it("voto repetido (UNIQUE, P2002) devolve duplicate e desfaz a soma", async () => {
    const product = buildProduct({ upvotes: 4 });
    await insertProducts([product]);
    const user = await testPrisma.user.create({ data: { externalId: "u1" } });
    await repository.add(user.id, product.id);

    const result = await repository.add(user.id, product.id);

    expect(result).toEqual({ status: "duplicate" });
    expect(await upvotesOf(product.id)).toBe(5);
    expect(await testPrisma.vote.count()).toBe(1);
  });

  it("produto apagado entre a checagem e o voto devolve product_not_found", async () => {
    const user = await testPrisma.user.create({ data: { externalId: "u1" } });

    const result = await repository.add(
      user.id,
      "00000000-0000-4000-8000-000000000000",
    );

    expect(result).toEqual({ status: "product_not_found" });
    expect(await testPrisma.vote.count()).toBe(0);
  });
});

describe("PrismaVoteRepository.remove", () => {
  it("apaga o voto e tira 1 de upvotes, devolvendo o novo total", async () => {
    const product = buildProduct({ upvotes: 1 });
    await insertProducts([product]);
    const [voter] = await insertVoters(product.id, 1);

    const result = await repository.remove(voter!.id, product.id);

    expect(result).toEqual({ upvotes: 0 });
    expect(await testPrisma.vote.count()).toBe(0);
  });

  it("devolve null quando não há voto, sem mexer em upvotes", async () => {
    const product = buildProduct({ upvotes: 3 });
    await insertProducts([product]);
    const user = await testPrisma.user.create({ data: { externalId: "u1" } });

    expect(await repository.remove(user.id, product.id)).toBeNull();
    expect(await upvotesOf(product.id)).toBe(3);
  });

  it("nunca deixa upvotes negativo, mesmo com o contador já divergente", async () => {
    // Divergência forçada: o voto existe, mas o contador já está em 0.
    const product = buildProduct({ upvotes: 0 });
    await insertProducts([product]);
    const [voter] = await insertVoters(product.id, 1);

    const result = await repository.remove(voter!.id, product.id);

    expect(result).toEqual({ upvotes: 0 });
    expect(await testPrisma.vote.count()).toBe(0);
  });
});

describe("PrismaVoteRepository.votedProductIds", () => {
  it("diz em quais dos produtos informados o usuário (id do Clerk) votou", async () => {
    const [a, b, c] = [buildProduct(), buildProduct(), buildProduct()];
    await insertProducts([a!, b!, c!]);
    const ana = await testPrisma.user.create({ data: { externalId: "ana" } });
    const bia = await testPrisma.user.create({ data: { externalId: "bia" } });
    await testPrisma.vote.createMany({
      data: [
        { userId: ana.id, productId: a!.id },
        { userId: ana.id, productId: c!.id },
        { userId: bia.id, productId: b!.id },
      ],
    });

    const voted = await repository.votedProductIds("ana", [a!.id, b!.id]);

    expect([...voted]).toEqual([a!.id]);
  });

  it("devolve vazio para quem nunca votou (nem existe no banco)", async () => {
    const product = buildProduct();
    await insertProducts([product]);

    expect(
      (await repository.votedProductIds("desconhecido", [product.id])).size,
    ).toBe(0);
  });
});
