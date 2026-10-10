import { idSchema } from "@/lib/validation/common";
import type { VoteDTO } from "@/types/api";

import { BusinessRuleError, ConflictError, NotFoundError } from "../errors";
import { productRepository, voteRepository } from "../repositories";
import type { ProductRepository } from "../repositories/productRepository";
import type { VoteRepository } from "../repositories/voteRepository";
import { parseInput } from "../validation";
import { productNotFound } from "./productService";

type Dependencies = {
  productRepository: Pick<ProductRepository, "findById">;
  voteRepository: Pick<VoteRepository, "add" | "remove">;
};

/**
 * Voto toggle (regras 2 a 5): a interface manda `vote` quando o botão está
 * inativo e `unvote` quando está ativo. `userId` é o id interno, de
 * `requireUser()`.
 */
export function createVoteService({
  productRepository,
  voteRepository,
}: Dependencies) {
  return {
    async vote(userId: string, productId: unknown): Promise<VoteDTO> {
      const id = parseInput(idSchema, productId, "id");

      const product = await productRepository.findById(id);
      if (!product) throw productNotFound();
      if (product.status !== "LAUNCHED") {
        throw new BusinessRuleError(
          "Este produto ainda não foi lançado e não recebe votos.",
          { code: "PRODUCT_NOT_VOTABLE" },
        );
      }

      const result = await voteRepository.add(userId, id);
      switch (result.status) {
        case "created":
          return {
            productId: id,
            upvotes: result.upvotes,
            viewerHasVoted: true,
          };
        case "duplicate":
          throw new ConflictError("Você já votou neste produto.", {
            code: "ALREADY_VOTED",
          });
        case "product_not_found":
          throw productNotFound();
      }
    },

    async unvote(userId: string, productId: unknown): Promise<VoteDTO> {
      const id = parseInput(idSchema, productId, "id");

      const result = await voteRepository.remove(userId, id);
      if (!result) {
        throw new NotFoundError("Você não votou neste produto.", {
          code: "VOTE_NOT_FOUND",
        });
      }

      return { productId: id, upvotes: result.upvotes, viewerHasVoted: false };
    },
  };
}

export type VoteService = ReturnType<typeof createVoteService>;

export const voteService = createVoteService({
  productRepository,
  voteRepository,
});
