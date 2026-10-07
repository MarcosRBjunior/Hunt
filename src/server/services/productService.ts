import type { ProductDTO, ReviewedProductDTO } from "@/types/api";

import { productRepository } from "../repositories";
import type {
  Product,
  ProductRepository,
  ReviewedProduct,
} from "../repositories/productRepository";

type Dependencies = {
  productRepository: ProductRepository;
};

/** Quantos revisados a lateral mostra (CLAUDE.md › Regras de negócio, 9). */
const REVIEWED_LIMIT = 3;

function toProductDTO(product: Product): ProductDTO {
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    url: product.url,
    logoUrl: product.logoUrl,
    upvotes: product.upvotes,
    visits: product.visits,
    status: product.status,
    topics: product.topics,
    // Preenchido com o voto do usuário logado na Fase 7.
    viewerHasVoted: false,
    createdAt: product.createdAt.toISOString(),
  };
}

function toReviewedProductDTO(product: ReviewedProduct): ReviewedProductDTO {
  return {
    ...toProductDTO(product),
    review: { rating: product.review.rating, summary: product.review.summary },
  };
}

export function createProductService({ productRepository }: Dependencies) {
  return {
    async listLaunched(): Promise<ProductDTO[]> {
      const products = await productRepository.listLaunched();
      return products.map(toProductDTO);
    },

    async listReviewed(): Promise<ReviewedProductDTO[]> {
      const products = await productRepository.listReviewed(REVIEWED_LIMIT);
      return products.map(toReviewedProductDTO);
    },

    async listUpcoming(): Promise<ProductDTO[]> {
      const products = await productRepository.listUpcoming();
      return products.map(toProductDTO);
    },
  };
}

export type ProductService = ReturnType<typeof createProductService>;

export const productService = createProductService({ productRepository });
