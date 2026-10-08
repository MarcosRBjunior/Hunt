import { describe, expect, it } from "vitest";

import rawProducts from "@/mocks/products.json";
import { parseMockProducts } from "@/server/repositories/mockProductRepository";

import {
  buildDemoVotes,
  demoUserCount,
  demoUserExternalIds,
  isDemoEnabled,
} from "../../../prisma/demoData";
import { buildProduct } from "../../helpers/buildProduct";

describe("isDemoEnabled", () => {
  it("liga só com 'true'", () => {
    expect(isDemoEnabled("true")).toBe(true);
  });

  it.each([undefined, "", "false"])("desliga com %j", (value) => {
    expect(isDemoEnabled(value)).toBe(false);
  });

  it("falha com valor desconhecido, em vez de adivinhar", () => {
    expect(() => isDemoEnabled("sim")).toThrow("SEED_DEMO");
  });
});

describe("demoUserExternalIds", () => {
  it("gera ids determinísticos e únicos", () => {
    const ids = demoUserExternalIds(3);

    expect(ids).toEqual([
      "seed_demo_user_0001",
      "seed_demo_user_0002",
      "seed_demo_user_0003",
    ]);
    expect(demoUserExternalIds(3)).toEqual(ids);
  });
});

describe("buildDemoVotes", () => {
  it("dá a cada produto tantos votos quanto seus upvotes, sem repetir usuário", () => {
    const products = [
      buildProduct({ upvotes: 3 }),
      buildProduct({ upvotes: 1 }),
      buildProduct({ upvotes: 0 }),
    ];

    const votes = buildDemoVotes(products);

    for (const product of products) {
      const productVotes = votes.filter(
        (vote) => vote.productId === product.id,
      );
      const voters = new Set(productVotes.map((vote) => vote.externalId));

      expect(productVotes).toHaveLength(product.upvotes);
      expect(voters.size).toBe(product.upvotes);
    }
    expect(demoUserCount(products)).toBe(3);
  });

  it("falha se um produto UPCOMING tiver votos (regra 5)", () => {
    const products = [buildProduct({ status: "UPCOMING", upvotes: 2 })];

    expect(() => buildDemoVotes(products)).toThrow("UPCOMING");
  });

  it("com os dados do mock: 298 usuários e 631 votos (298 + 202 + 102 + 29)", () => {
    const products = parseMockProducts(rawProducts);

    expect(demoUserCount(products)).toBe(298);
    expect(buildDemoVotes(products)).toHaveLength(631);
  });
});
