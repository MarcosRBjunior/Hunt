import { describe, expect, it, type Mock, vi } from "vitest";

import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/server/errors";
import type { Product } from "@/server/repositories/productRepository";
import type { VoteRepository } from "@/server/repositories/voteRepository";
import { createVoteService } from "@/server/services/voteService";

import { buildProduct } from "../../../helpers/buildProduct";
import {
  stubProductRepository,
  stubVoteRepository,
} from "../../../helpers/stubRepositories";

const userId = "11111111-1111-4111-8111-111111111111";
const productId = "a59e45f4-7972-4bf3-ae41-0d6136c45f8c";

function serviceWith({
  product = buildProduct({ id: productId, upvotes: 10 }),
  add = vi.fn<VoteRepository["add"]>(async () => ({
    status: "created",
    upvotes: 11,
  })),
  remove = vi.fn<VoteRepository["remove"]>(async () => ({ upvotes: 9 })),
}: {
  product?: Product | null;
  add?: Mock<VoteRepository["add"]>;
  remove?: Mock<VoteRepository["remove"]>;
} = {}) {
  const findById = vi.fn(async () => product);
  const service = createVoteService({
    productRepository: stubProductRepository({ findById }),
    voteRepository: stubVoteRepository({ add, remove }),
  });
  return { service, add, remove, findById };
}

async function errorOf(promise: Promise<unknown>) {
  return promise.then(
    () => {
      throw new Error("deveria ter falhado");
    },
    (error: unknown) => error,
  );
}

describe("voteService.vote", () => {
  it("grava o voto e devolve o novo total com o botão ativo", async () => {
    const { service, add } = serviceWith();

    const result = await service.vote(userId, productId);

    expect(add).toHaveBeenCalledWith(userId, productId);
    expect(result).toEqual({ productId, upvotes: 11, viewerHasVoted: true });
  });

  it("recusa id que não é UUID com 400, sem tocar no banco", async () => {
    const { service, add, findById } = serviceWith();

    const error = await errorOf(service.vote(userId, "123"));

    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toHaveProperty("details.fields.id");
    expect(findById).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it("produto inexistente: 404 PRODUCT_NOT_FOUND", async () => {
    const { service, add } = serviceWith({ product: null });

    const error = await errorOf(service.vote(userId, productId));

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toHaveProperty("code", "PRODUCT_NOT_FOUND");
    expect(add).not.toHaveBeenCalled();
  });

  it("TC-09: produto UPCOMING não recebe voto: 422 PRODUCT_NOT_VOTABLE", async () => {
    const { service, add } = serviceWith({
      product: buildProduct({ id: productId, status: "UPCOMING" }),
    });

    const error = await errorOf(service.vote(userId, productId));

    expect(error).toBeInstanceOf(BusinessRuleError);
    expect(error).toHaveProperty("status", 422);
    expect(error).toHaveProperty("code", "PRODUCT_NOT_VOTABLE");
    expect(add).not.toHaveBeenCalled();
  });

  it("TC-06: voto repetido: 409 ALREADY_VOTED", async () => {
    const { service } = serviceWith({
      add: vi.fn<VoteRepository["add"]>(async () => ({ status: "duplicate" })),
    });

    const error = await errorOf(service.vote(userId, productId));

    expect(error).toBeInstanceOf(ConflictError);
    expect(error).toHaveProperty("code", "ALREADY_VOTED");
  });

  it("produto apagado durante o voto: 404 PRODUCT_NOT_FOUND", async () => {
    const { service } = serviceWith({
      add: vi.fn<VoteRepository["add"]>(async () => ({
        status: "product_not_found",
      })),
    });

    const error = await errorOf(service.vote(userId, productId));

    expect(error).toHaveProperty("code", "PRODUCT_NOT_FOUND");
  });
});

describe("voteService.unvote", () => {
  it("remove o voto e devolve o novo total com o botão inativo", async () => {
    const { service, remove } = serviceWith();

    const result = await service.unvote(userId, productId);

    expect(remove).toHaveBeenCalledWith(userId, productId);
    expect(result).toEqual({ productId, upvotes: 9, viewerHasVoted: false });
  });

  it("TC-08: sem voto para remover: 404 VOTE_NOT_FOUND", async () => {
    const { service } = serviceWith({
      remove: vi.fn<VoteRepository["remove"]>(async () => null),
    });

    const error = await errorOf(service.unvote(userId, productId));

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toHaveProperty("code", "VOTE_NOT_FOUND");
  });

  it("recusa id que não é UUID com 400", async () => {
    const { service, remove } = serviceWith();

    const error = await errorOf(service.unvote(userId, "abc"));

    expect(error).toBeInstanceOf(ValidationError);
    expect(remove).not.toHaveBeenCalled();
  });
});
