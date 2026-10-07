import { describe, expect, it } from "vitest";

import type {
  Product,
  ProductRepository,
  ReviewedProduct,
} from "@/server/repositories/productRepository";
import { createProductService } from "@/server/services/productService";
import { buildProduct } from "../../../helpers/buildProduct";

function repositoryWith({
  launched = [],
  reviewed = [],
  upcoming = [],
}: {
  launched?: Product[];
  reviewed?: ReviewedProduct[];
  upcoming?: Product[];
}): ProductRepository & { lastReviewedLimit?: number } {
  const repository: ProductRepository & { lastReviewedLimit?: number } = {
    listLaunched: async () => launched,
    listReviewed: async (limit) => {
      repository.lastReviewedLimit = limit;
      return reviewed.slice(0, limit);
    },
    listUpcoming: async () => upcoming,
  };
  return repository;
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
    const service = createProductService({
      productRepository: repositoryWith({ launched: [product] }),
    });

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
    const service = createProductService({
      productRepository: repositoryWith({
        launched: [
          buildProduct({ title: "Primeiro", upvotes: 1 }),
          buildProduct({ title: "Segundo", upvotes: 50 }),
        ],
      }),
    });

    const products = await service.listLaunched();

    expect(products.map((product) => product.title)).toEqual([
      "Primeiro",
      "Segundo",
    ]);
  });
});

describe("productService.listReviewed", () => {
  it("pede até 3 revisados por padrão e inclui a revisão no DTO", async () => {
    const product = buildProduct({
      title: "Layer",
      createdAt: new Date("2026-09-24T15:30:00.000Z"),
    });
    const repository = repositoryWith({
      reviewed: [{ ...product, review: { rating: 5, summary: "Muito bom." } }],
    });
    const service = createProductService({ productRepository: repository });

    const [dto] = await service.listReviewed();

    expect(repository.lastReviewedLimit).toBe(3);
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
    const service = createProductService({
      productRepository: repositoryWith({
        upcoming: [buildProduct({ title: "zwelie", status: "UPCOMING" })],
      }),
    });

    const upcoming = await service.listUpcoming();

    expect(upcoming).toEqual([
      expect.objectContaining({ title: "zwelie", status: "UPCOMING" }),
    ]);
    expect(upcoming[0]).not.toHaveProperty("review");
  });
});
