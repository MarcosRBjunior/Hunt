import { describe, expect, it, vi } from "vitest";

import { NotFoundError, ValidationError } from "@/server/errors";
import type { ProductRepository } from "@/server/repositories/productRepository";
import type { VoteRepository } from "@/server/repositories/voteRepository";
import { createProductService } from "@/server/services/productService";

import { buildProduct } from "../../../helpers/buildProduct";
import {
  stubProductRepository,
  stubVoteRepository,
} from "../../../helpers/stubRepositories";

function serviceWith(
  products: Partial<ProductRepository> = {},
  votes: Partial<VoteRepository> = {},
) {
  return createProductService({
    productRepository: stubProductRepository(products),
    voteRepository: stubVoteRepository(votes),
  });
}

describe("productService.listLaunched", () => {
  it("converte o produto para ProductDTO", async () => {
    const product = buildProduct({
      id: "05ad3ecd-3696-46bb-84a3-c5eedd4eda67",
      title: "Layer",
      description: "A API visual.",
      url: "https://example.com/layer",
      logoUrl: "https://example.com/layer.png",
      upvotes: 202,
      visits: 860,
      topics: [{ slug: "tech", name: "Tech" }],
      createdAt: new Date("2026-09-24T15:30:00.000Z"),
    });
    const service = serviceWith({ listLaunched: async () => [product] });

    const [dto] = await service.listLaunched();

    expect(dto).toEqual({
      id: "05ad3ecd-3696-46bb-84a3-c5eedd4eda67",
      title: "Layer",
      description: "A API visual.",
      url: "https://example.com/layer",
      logoUrl: "https://example.com/layer.png",
      upvotes: 202,
      visits: 860,
      status: "LAUNCHED",
      topics: [{ slug: "tech", name: "Tech" }],
      viewerHasVoted: false,
      createdAt: "2026-09-24T15:30:00.000Z",
    });
  });

  it("mantém a ordem definida pelo repositório", async () => {
    const service = serviceWith({
      listLaunched: async () => [
        buildProduct({ title: "Primeiro", upvotes: 1 }),
        buildProduct({ title: "Segundo", upvotes: 50 }),
      ],
    });

    const products = await service.listLaunched();

    expect(products.map((product) => product.title)).toEqual([
      "Primeiro",
      "Segundo",
    ]);
  });

  it("para o visitante, nenhum produto aparece votado e os votos nem são consultados", async () => {
    const votedProductIds = vi.fn(async () => new Set<string>());
    const service = serviceWith(
      { listLaunched: async () => [buildProduct()] },
      { votedProductIds },
    );

    const products = await service.listLaunched(null);

    expect(products[0]?.viewerHasVoted).toBe(false);
    expect(votedProductIds).not.toHaveBeenCalled();
  });

  it("para o usuário logado, marca os produtos em que ele votou", async () => {
    const voted = buildProduct({ title: "Votado" });
    const other = buildProduct({ title: "Outro" });
    const votedProductIds = vi.fn(async () => new Set([voted.id]));
    const service = serviceWith(
      { listLaunched: async () => [voted, other] },
      { votedProductIds },
    );

    const products = await service.listLaunched({ externalId: "user_1" });

    expect(votedProductIds).toHaveBeenCalledWith("user_1", [
      voted.id,
      other.id,
    ]);
    expect(
      products.map(({ title, viewerHasVoted }) => [title, viewerHasVoted]),
    ).toEqual([
      ["Votado", true],
      ["Outro", false],
    ]);
  });
});

describe("productService.listReviewed", () => {
  it("pede até 3 revisados e inclui a revisão no DTO", async () => {
    const listReviewed = vi.fn(async () => [
      {
        ...buildProduct({
          title: "Layer",
          createdAt: new Date("2026-09-24T15:30:00.000Z"),
        }),
        review: { rating: 5, summary: "Muito bom." },
      },
    ]);
    const service = serviceWith({ listReviewed });

    const [dto] = await service.listReviewed();

    expect(listReviewed).toHaveBeenCalledWith(3);
    expect(dto).toMatchObject({
      title: "Layer",
      createdAt: "2026-09-24T15:30:00.000Z",
      viewerHasVoted: false,
      review: { rating: 5, summary: "Muito bom." },
    });
  });
});

describe("productService.listUpcoming", () => {
  it("converte os produtos em breve para ProductDTO", async () => {
    const service = serviceWith({
      listUpcoming: async () => [
        buildProduct({ title: "zwelie", status: "UPCOMING" }),
      ],
    });

    const upcoming = await service.listUpcoming();

    expect(upcoming).toEqual([
      expect.objectContaining({ title: "zwelie", status: "UPCOMING" }),
    ]);
    expect(upcoming[0]).not.toHaveProperty("review");
  });
});

describe("productService.registerVisit", () => {
  const id = "a59e45f4-7972-4bf3-ae41-0d6136c45f8c";

  it("soma uma visita ao produto", async () => {
    const incrementVisits = vi.fn(async () => true);
    const service = serviceWith({ incrementVisits });

    await service.registerVisit(id);

    expect(incrementVisits).toHaveBeenCalledWith(id);
  });

  it("TC-24: produto inexistente: 404 PRODUCT_NOT_FOUND", async () => {
    const service = serviceWith({ incrementVisits: async () => false });

    const error = await service.registerVisit(id).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toHaveProperty("code", "PRODUCT_NOT_FOUND");
  });

  it("recusa id que não é UUID com 400, sem tocar no banco", async () => {
    const incrementVisits = vi.fn(async () => true);
    const service = serviceWith({ incrementVisits });

    const error = await service.registerVisit("1 OR 1=1").catch((e) => e);

    expect(error).toBeInstanceOf(ValidationError);
    expect(incrementVisits).not.toHaveBeenCalled();
  });
});
