import { describe, expect, it } from "vitest";

import type {
  Product,
  ProductRepository,
} from "@/server/repositories/productRepository";
import { createProductService } from "@/server/services/productService";
import { buildProduct } from "../../../helpers/buildProduct";

function repositoryWith(products: Product[]): ProductRepository {
  return { listLaunched: async () => products };
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
      productRepository: repositoryWith([product]),
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
      productRepository: repositoryWith([
        buildProduct({ title: "Primeiro", upvotes: 1 }),
        buildProduct({ title: "Segundo", upvotes: 50 }),
      ]),
    });

    const products = await service.listLaunched();

    expect(products.map((product) => product.title)).toEqual([
      "Primeiro",
      "Segundo",
    ]);
  });
});
