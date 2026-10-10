import { idSchema } from "@/lib/validation/common";
import {
  createProductSchema,
  updateProductSchema,
} from "@/lib/validation/product";
import type { ProductDTO } from "@/types/api";

import { productRepository } from "../repositories";
import type { ProductRepository } from "../repositories/productRepository";
import { parseInput } from "../validation";
import { productNotFound, toProductDTO } from "./productService";

type Dependencies = {
  productRepository: ProductRepository;
};

/**
 * CRUD da área admin (regra 7). O papel de admin é conferido no handler, com
 * `requireAdmin()`; aqui ficam a validação e as regras dos dados.
 */
export function createAdminProductService({ productRepository }: Dependencies) {
  return {
    async list(): Promise<ProductDTO[]> {
      const products = await productRepository.listAll();
      return products.map((product) => toProductDTO(product));
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
