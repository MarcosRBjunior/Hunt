import type { ProductDTO, ReviewedProductDTO } from "@/types/api";

export function buildProductDTO(
  overrides: Partial<ProductDTO> = {},
): ProductDTO {
  return {
    id: "aea24f42-490d-46d3-8400-9bcd5fe1565d",
    title: "Layer",
    description: "A API visual que conecta suas ferramentas favoritas.",
    url: "https://example.com/layer",
    logoUrl: null,
    upvotes: 202,
    visits: 1240,
    status: "LAUNCHED",
    topics: [
      { slug: "tech", name: "Tech" },
      { slug: "saas", name: "SaaS" },
    ],
    viewerHasVoted: false,
    createdAt: "2026-09-24T15:30:00.000Z",
    ...overrides,
  };
}

export function buildReviewedProductDTO(
  overrides: Partial<ReviewedProductDTO> = {},
): ReviewedProductDTO {
  return {
    ...buildProductDTO(),
    review: {
      rating: 5,
      summary: "A forma mais simples de integrar ferramentas.",
    },
    ...overrides,
  };
}
