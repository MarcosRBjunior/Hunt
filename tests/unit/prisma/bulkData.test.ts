import { describe, expect, it } from "vitest";

import { TOPIC_SLUGS } from "@/lib/topics";
import { idSchema } from "@/lib/validation/common";
import rawProducts from "@/mocks/products.json";
import { parseMockProducts } from "@/server/repositories/mockProductRepository";

import {
  BULK_MAX_UPVOTES,
  BULK_PRODUCT_COUNT,
  buildBulkProducts,
  bulkProductId,
} from "../../../prisma/bulkData";
import { buildDemoVotes, demoUserCount } from "../../../prisma/demoData";

const products = buildBulkProducts();

describe("buildBulkProducts", () => {
  it("com a demo, o banco fica com 1.000 produtos", () => {
    expect(products).toHaveLength(BULK_PRODUCT_COUNT);
    expect(parseMockProducts(rawProducts).length + products.length).toBe(1000);
  });

  it("é determinístico: a mesma saída a cada execução", () => {
    expect(buildBulkProducts()).toEqual(products);
    // O produto N não depende do total gerado.
    expect(buildBulkProducts(10)).toEqual(products.slice(0, 10));
  });

  it("gera ids UUID únicos, que não colidem com os da demo", () => {
    const ids = products.map((product) => product.id);
    const demoIds = parseMockProducts(rawProducts).map((product) => product.id);

    for (const id of ids) expect(idSchema.safeParse(id).success).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => demoIds.includes(id))).toEqual([]);
    expect(bulkProductId(0)).toBe(ids[0]);
  });

  it("passa nas mesmas validações do mock (as restrições do banco)", () => {
    const records = products.map(({ createdAt, ...product }) => ({
      ...product,
      createdAt: createdAt.toISOString(),
    }));

    expect(parseMockProducts(records)).toEqual(products);
  });

  it("tem nomes e urls únicos", () => {
    expect(new Set(products.map((product) => product.title)).size).toBe(
      products.length,
    );
    expect(new Set(products.map((product) => product.url)).size).toBe(
      products.length,
    );
  });

  it("dá a cada produto de 1 a 3 topics do seed, sem repetir", () => {
    for (const { topics } of products) {
      const slugs = topics.map((topic) => topic.slug);

      expect(slugs.length).toBeGreaterThanOrEqual(1);
      expect(slugs.length).toBeLessThanOrEqual(3);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const slug of slugs) expect(TOPIC_SLUGS).toContain(slug);
    }
    // Todos os topics aparecem (o filtro tem o que mostrar em cada um).
    const used = new Set(products.flatMap((p) => p.topics.map((t) => t.slug)));
    expect(used.size).toBe(TOPIC_SLUGS.length);
  });

  it("só gera LAUNCHED, sem logo nem revisão", () => {
    for (const product of products) {
      expect(product.status).toBe("LAUNCHED");
      expect(product.logoUrl).toBeNull();
      expect(product.review).toBeNull();
    }
  });

  it("tem datas diferentes, para o desempate por data ser estável", () => {
    const dates = products.map((product) => product.createdAt.getTime());

    expect(new Set(dates).size).toBe(dates.length);
  });

  it("distribui os votos em cauda longa, com empates e abaixo do topo da demo", () => {
    const upvotes = products.map((product) => product.upvotes);
    const distinct = new Set(upvotes);

    expect(Math.max(...upvotes)).toBeLessThanOrEqual(BULK_MAX_UPVOTES);
    expect(Math.max(...upvotes)).toBeLessThan(298);
    expect(distinct.size).toBeLessThan(upvotes.length);
    // Mais da metade fica abaixo de 1/4 do teto.
    const low = upvotes.filter((value) => value < BULK_MAX_UPVOTES / 4);
    expect(low.length).toBeGreaterThan(products.length / 2);
  });

  it("os usuários fictícios da demo bastam para os votos (upvotes = count(votes))", () => {
    const all = [...parseMockProducts(rawProducts), ...products];
    const votes = buildDemoVotes(all);

    expect(demoUserCount(all)).toBe(298);
    expect(votes).toHaveLength(
      all.reduce((total, product) => total + product.upvotes, 0),
    );
  });
});
