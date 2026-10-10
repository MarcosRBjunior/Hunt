import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaProductRepository } from "@/server/repositories/prismaProductRepository";
import { PrismaUserRepository } from "@/server/repositories/userRepository";
import { PrismaVoteRepository } from "@/server/repositories/voteRepository";
import { createProductService } from "@/server/services/productService";
import { createUserService } from "@/server/services/userService";
import { createVoteService } from "@/server/services/voteService";

import { buildProduct } from "../helpers/buildProduct";
import { insertProducts, resetDatabase, testPrisma } from "./helpers";

const productRepository = new PrismaProductRepository(testPrisma);
const voteRepository = new PrismaVoteRepository(testPrisma);
const voteService = createVoteService({ productRepository, voteRepository });
const productService = createProductService({
  productRepository,
  voteRepository,
});
const userService = createUserService({
  userRepository: new PrismaUserRepository(() => testPrisma),
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase();
});

/** Usuário local, como `requireUser()` faz na primeira ação autenticada. */
async function signedInUser(externalId = "user_clerk_1") {
  return userService.ensureUser(externalId);
}

async function upvotesOf(productId: string) {
  return (await productRepository.findById(productId))?.upvotes;
}

describe("voteService com Postgres", () => {
  it("TC-05: primeiro voto responde com +1 e grava 1 linha em votes", async () => {
    const product = buildProduct({ upvotes: 41 });
    await insertProducts([product]);
    const user = await signedInUser();

    const result = await voteService.vote(user.id, product.id);

    expect(result).toEqual({
      productId: product.id,
      upvotes: 42,
      viewerHasVoted: true,
    });
    expect(await upvotesOf(product.id)).toBe(42);
    expect(await testPrisma.vote.count()).toBe(1);
  });

  it("TC-06: voto repetido dá 409 ALREADY_VOTED e o contador fica intacto", async () => {
    const product = buildProduct({ upvotes: 41 });
    await insertProducts([product]);
    const user = await signedInUser();
    await voteService.vote(user.id, product.id);

    const error = await voteService.vote(user.id, product.id).catch((e) => e);

    expect(error).toMatchObject({ status: 409, code: "ALREADY_VOTED" });
    expect(await upvotesOf(product.id)).toBe(42);
    expect(await testPrisma.vote.count()).toBe(1);
  });

  it("TC-07: 10 requisições simultâneas do mesmo usuário gravam exatamente 1 voto", async () => {
    const product = buildProduct({ upvotes: 0 });
    await insertProducts([product]);
    const user = await signedInUser();

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => voteService.vote(user.id, product.id)),
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.flatMap((r) =>
      r.status === "rejected" ? [r.reason] : [],
    );
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(9);
    expect(rejected.every((error) => error.code === "ALREADY_VOTED")).toBe(
      true,
    );
    expect(await testPrisma.vote.count()).toBe(1);
    expect(await upvotesOf(product.id)).toBe(1);
  });

  it("TC-08: remover voto inexistente dá 404 VOTE_NOT_FOUND, sem mexer no contador", async () => {
    const product = buildProduct({ upvotes: 0 });
    await insertProducts([product]);
    const user = await signedInUser();

    const error = await voteService.unvote(user.id, product.id).catch((e) => e);

    expect(error).toMatchObject({ status: 404, code: "VOTE_NOT_FOUND" });
    expect(await upvotesOf(product.id)).toBe(0);
  });

  it("TC-09: votar em produto UPCOMING dá 422 e não grava nada", async () => {
    const product = buildProduct({ status: "UPCOMING", upvotes: 0 });
    await insertProducts([product]);
    const user = await signedInUser();

    const error = await voteService.vote(user.id, product.id).catch((e) => e);

    expect(error).toMatchObject({ status: 422, code: "PRODUCT_NOT_VOTABLE" });
    expect(await testPrisma.vote.count()).toBe(0);
    expect(await upvotesOf(product.id)).toBe(0);
  });

  it("TC-26: votar e clicar de novo remove o voto e o contador volta", async () => {
    const product = buildProduct({ upvotes: 7 });
    await insertProducts([product]);
    const user = await signedInUser();

    await voteService.vote(user.id, product.id);
    const result = await voteService.unvote(user.id, product.id);

    expect(result).toEqual({
      productId: product.id,
      upvotes: 7,
      viewerHasVoted: false,
    });
    expect(await testPrisma.vote.count()).toBe(0);
    expect(await upvotesOf(product.id)).toBe(7);
  });

  it("produto inexistente dá 404 PRODUCT_NOT_FOUND", async () => {
    const user = await signedInUser();

    const error = await voteService
      .vote(user.id, "00000000-0000-4000-8000-000000000000")
      .catch((e) => e);

    expect(error).toMatchObject({ status: 404, code: "PRODUCT_NOT_FOUND" });
  });

  it("votos de usuários diferentes somam no mesmo produto", async () => {
    const product = buildProduct({ upvotes: 0 });
    await insertProducts([product]);
    const ana = await signedInUser("ana");
    const bia = await signedInUser("bia");

    await voteService.vote(ana.id, product.id);
    await voteService.vote(bia.id, product.id);

    expect(await upvotesOf(product.id)).toBe(2);
  });
});

describe("productService com Postgres", () => {
  it("viewerHasVoted: só os produtos votados pelo usuário logado aparecem ativos", async () => {
    const voted = buildProduct({ title: "Votado", upvotes: 5 });
    const other = buildProduct({ title: "Outro", upvotes: 3 });
    await insertProducts([voted, other]);
    const ana = await signedInUser("ana");
    const bia = await signedInUser("bia");
    await voteService.vote(ana.id, voted.id);
    await voteService.vote(bia.id, other.id);

    const forAna = await productService.listLaunched({ externalId: "ana" });
    const forVisitor = await productService.listLaunched();

    expect(forAna.map((p) => [p.title, p.viewerHasVoted])).toEqual([
      ["Votado", true],
      ["Outro", false],
    ]);
    expect(forVisitor.every((p) => !p.viewerHasVoted)).toBe(true);
  });

  it("TC-21: o clique do visitante soma 1 em visits", async () => {
    const product = buildProduct({ visits: 99 });
    await insertProducts([product]);

    await productService.registerVisit(product.id);

    expect((await productRepository.findById(product.id))?.visits).toBe(100);
  });
});
