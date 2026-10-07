import type { ProductDTO } from "@/types/api";

import { productRepository } from "../repositories";
import type {
  Product,
  ProductRepository,
} from "../repositories/productRepository";

type Dependencies = {
  productRepository: ProductRepository;
};

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

export function createProductService({ productRepository }: Dependencies) {
  return {
    async listLaunched(): Promise<ProductDTO[]> {
      const products = await productRepository.listLaunched();
      return products.map(toProductDTO);
    },
  };
}

export type ProductService = ReturnType<typeof createProductService>;

export const productService = createProductService({ productRepository });
