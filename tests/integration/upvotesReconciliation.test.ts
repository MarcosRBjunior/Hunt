import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { reconcileUpvotes } from "@/server/repositories/upvotesReconciliation";

import { buildProduct } from "../helpers/buildProduct";
import {
  insertProducts,
  insertVoters,
  resetDatabase,
  testPrisma,
} from "./helpers";

afterAll(async () => {
  await testPrisma.$disconnect();
});

beforeEach(async () => {
  await resetDatabase();
});

async function upvotesByTitle() {
  const products = await testPrisma.product.findMany({
    orderBy: { title: "asc" },
    select: { title: true, upvotes: true },
  });
  return products.map(({ title, upvotes }) => [title, upvotes]);
}

describe("reconcileUpvotes", () => {
  it("TC-18: depois de uma divergência forçada, upvotes volta a ser count(votes)", async () => {
    const inflated = buildProduct({ title: "A inflado", upvotes: 99 });
    const deflated = buildProduct({ title: "B zerado", upvotes: 0 });
    const correct = buildProduct({ title: "C certo", upvotes: 1 });
    const orphan = buildProduct({ title: "D sem votos", upvotes: 5 });
    await insertProducts([inflated, deflated, correct, orphan]);
    await insertVoters(inflated.id, 2);
    await insertVoters(deflated.id, 3);
    await insertVoters(correct.id, 1);

    const fixed = await reconcileUpvotes(testPrisma);

    expect(await upvotesByTitle()).toEqual([
      ["A inflado", 2],
      ["B zerado", 3],
      ["C certo", 1],
      ["D sem votos", 0],
    ]);
    expect(fixed.map((product) => product.id).toSorted()).toEqual(
      [inflated.id, deflated.id, orphan.id].toSorted(),
    );
  });

  it("não mexe em nada quando já está tudo certo (pode rodar de novo)", async () => {
    const product = buildProduct({ upvotes: 99 });
    await insertProducts([product]);
    await insertVoters(product.id, 2);
    await reconcileUpvotes(testPrisma);

    expect(await reconcileUpvotes(testPrisma)).toEqual([]);
    expect(await upvotesByTitle()).toEqual([["Produto de teste", 2]]);
  });
});
