import { MockProductRepository } from "./mockProductRepository";
import type { ProductRepository } from "./productRepository";

export const productRepository: ProductRepository = new MockProductRepository();
