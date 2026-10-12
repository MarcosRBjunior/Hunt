import { z } from "zod";

import { idSchema } from "@/lib/validation/common";
import type { ProductDTO, ReviewedProductDTO } from "@/types/api";

import { NotFoundError } from "../errors";
import { productRepository, voteRepository } from "../repositories";
import type {
  Product,
  ProductRepository,
  ReviewedProduct,
} from "../repositories/productRepository";
import type { VoteRepository } from "../repositories/voteRepository";
import { parseInput } from "../validation";

type Dependencies = {
  productRepository: ProductRepository;
  voteRepository: Pick<VoteRepository, "votedProductIds">;
};

/** Quem está vendo a lista: basta o id do Clerk (não cria usuário). */
type Viewer = { externalId: string };

/** Quantos revisados a lateral mostra (CLAUDE.md › Regras de negócio, 9). */
const REVIEWED_LIMIT = 3;

/**
 * `?limit=` de `/products/reviewed`: de 1 a 10. A API não prevê erro nesse
 * endpoint, então valor ausente ou inválido vira o padrão.
 */
const reviewedLimitSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(10)
  .catch(REVIEWED_LIMIT);

export function toProductDTO(
  product: Product,
  viewerHasVoted = false,
): ProductDTO {
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
    viewerHasVoted,
    createdAt: product.createdAt.toISOString(),
  };
}

function toReviewedProductDTO(product: ReviewedProduct): ReviewedProductDTO {
  return {
    ...toProductDTO(product),
    review: { rating: product.review.rating, summary: product.review.summary },
  };
}

export function productNotFound(): NotFoundError {
  return new NotFoundError("Produto não encontrado.", {
    code: "PRODUCT_NOT_FOUND",
  });
}

export function createProductService({
  productRepository,
  voteRepository,
}: Dependencies) {
  return {
    /** Lista principal; com `viewer`, preenche `viewerHasVoted`. */
    async listLaunched(viewer: Viewer | null = null): Promise<ProductDTO[]> {
      const products = await productRepository.listLaunched();
      if (!viewer) return products.map((product) => toProductDTO(product));

      const voted = await voteRepository.votedProductIds(
        viewer.externalId,
        products.map((product) => product.id),
      );
      return products.map((product) =>
        toProductDTO(product, voted.has(product.id)),
      );
    },

    /** "Produtos revisados por nós": por nota decrescente, até `limit` (padrão 3). */
    async listReviewed(limit?: unknown): Promise<ReviewedProductDTO[]> {
      const products = await productRepository.listReviewed(
        reviewedLimitSchema.parse(limit ?? REVIEWED_LIMIT),
      );
      return products.map(toReviewedProductDTO);
    },

    async listUpcoming(): Promise<ProductDTO[]> {
      const products = await productRepository.listUpcoming();
      return products.map((product) => toProductDTO(product));
    },

    /** Clique no link do produto: +1 visita, de qualquer perfil (regra 6). */
    async registerVisit(productId: unknown): Promise<void> {
      const id = parseInput(idSchema, productId, "id");

      if (!(await productRepository.incrementVisits(id))) {
        throw productNotFound();
      }
    },
  };
}

export type ProductService = ReturnType<typeof createProductService>;

export const productService = createProductService({
  productRepository,
  voteRepository,
});
