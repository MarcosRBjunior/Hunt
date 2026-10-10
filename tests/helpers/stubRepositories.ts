import type { ProductRepository } from "@/server/repositories/productRepository";
import type { VoteRepository } from "@/server/repositories/voteRepository";

function notConfigured(name: string) {
  return async () => {
    throw new Error(`${name} não foi configurado neste teste`);
  };
}

/** Repositório de produtos em que só os métodos passados funcionam. */
export function stubProductRepository(
  methods: Partial<ProductRepository> = {},
): ProductRepository {
  return {
    listLaunched: notConfigured("listLaunched"),
    listReviewed: notConfigured("listReviewed"),
    listUpcoming: notConfigured("listUpcoming"),
    listAll: notConfigured("listAll"),
    findById: notConfigured("findById"),
    create: notConfigured("create"),
    update: notConfigured("update"),
    delete: notConfigured("delete"),
    incrementVisits: notConfigured("incrementVisits"),
    ...methods,
  };
}

/** Repositório de votos em que só os métodos passados funcionam. */
export function stubVoteRepository(
  methods: Partial<VoteRepository> = {},
): VoteRepository {
  return {
    add: notConfigured("add"),
    remove: notConfigured("remove"),
    votedProductIds: notConfigured("votedProductIds"),
    ...methods,
  };
}
