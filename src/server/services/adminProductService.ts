import { idSchema } from "@/lib/validation/common";
import {
  createProductSchema,
  updateProductSchema,
} from "@/lib/validation/product";
import { reviewSchema } from "@/lib/validation/review";
import type { AdminProductDTO, ProductDTO, ReviewDTO } from "@/types/api";

import { productRepository } from "../repositories";
import type {
  AdminProduct,
  ProductRepository,
} from "../repositories/productRepository";
import { parseInput } from "../validation";
import { productNotFound, toProductDTO } from "./productService";

type Dependencies = {
  productRepository: ProductRepository;
};

function toAdminProductDTO({
  review,
  ...product
}: AdminProduct): AdminProductDTO {
  return {
    ...toProductDTO(product),
    review: review && { rating: review.rating, summary: review.summary },
  };
}

/**
 * CRUD da área admin (regra 7). O papel de admin é conferido no handler, com
 * `requireAdmin()`; aqui ficam a validação e as regras dos dados.
 */
export function createAdminProductService({ productRepository }: Dependencies) {
  return {
    async list(): Promise<AdminProductDTO[]> {
      const products = await productRepository.listAll();
      return products.map(toAdminProductDTO);
    },

    /** Produto de qualquer status, com a revisão (página de edição). */
    async get(productId: unknown): Promise<AdminProductDTO> {
      const id = parseInput(idSchema, productId, "id");

      const product = await productRepository.findWithReview(id);
      if (!product) throw productNotFound();

      return toAdminProductDTO(product);
    },

    async create(body: unknown): Promise<ProductDTO> {
      const product = parseInput(createProductSchema, body);
      return toProductDTO(await productRepository.create(product));
    },

    async update(productId: unknown, body: unknown): Promise<ProductDTO> {
      const id = parseInput(idSchema, productId, "id");
      const changes = parseInput(updateProductSchema, body);

      const product = await productRepository.update(id, changes);
      if (!product) throw productNotFound();

      return toProductDTO(product);
    },

    /** Cria ou substitui a revisão do produto (regra 9). */
    async saveReview(productId: unknown, body: unknown): Promise<ReviewDTO> {
      const id = parseInput(idSchema, productId, "id");
      const review = parseInput(reviewSchema, body);

      const saved = await productRepository.upsertReview(id, review);
      if (!saved) throw productNotFound();

      return { rating: saved.rating, summary: saved.summary };
    },

    async remove(productId: unknown): Promise<void> {
      const id = parseInput(idSchema, productId, "id");

      if (!(await productRepository.delete(id))) throw productNotFound();
    },
  };
}

export type AdminProductService = ReturnType<typeof createAdminProductService>;

export const adminProductService = createAdminProductService({
  productRepository,
});
