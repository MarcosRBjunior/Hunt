import { getPrisma } from "../db";
import { env } from "../env";
import { MockProductRepository } from "./mockProductRepository";
import { PrismaProductRepository } from "./prismaProductRepository";
import type { ProductRepository } from "./productRepository";

/** `PRODUCT_SOURCE` escolhe a fonte; a UI não sabe qual é (CLAUDE.md › Arquitetura). */
export const productRepository: ProductRepository =
  env.PRODUCT_SOURCE === "prisma"
    ? new PrismaProductRepository(getPrisma())
    : new MockProductRepository();
