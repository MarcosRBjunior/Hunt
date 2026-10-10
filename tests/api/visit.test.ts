import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/v1/products/[id]/visit/route";
import type { ProductRepository } from "@/server/repositories/productRepository";
import type { VoteRepository } from "@/server/repositories/voteRepository";

import { apiRequest, routeParams } from "../helpers/apiRequest";
import {
  stubProductRepository,
  stubVoteRepository,
} from "../helpers/stubRepositories";

const { repositories } = vi.hoisted(() => ({
  repositories: {
    productRepository: {} as ProductRepository,
    voteRepository: {} as VoteRepository,
    userRepository: {},
  },
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: null, sessionClaims: null }),
}));
vi.mock("@/server/repositories", () => repositories);

const productId = "a59e45f4-7972-4bf3-ae41-0d6136c45f8c";
const path = `/api/v1/products/${productId}/visit`;
const incrementVisits = vi.fn<ProductRepository["incrementVisits"]>();

beforeEach(() => {
  vi.clearAllMocks();
  incrementVisits.mockResolvedValue(true);
  Object.assign(
    repositories.productRepository,
    stubProductRepository({ incrementVisits }),
  );
  Object.assign(repositories.voteRepository, stubVoteRepository());
});

describe("POST /api/v1/products/{id}/visit", () => {
  it("TC-21: visitante sem login soma 1 visita e recebe 204 sem corpo", async () => {
    const response = await POST(
      apiRequest("POST", path),
      routeParams({ id: productId }),
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(incrementVisits).toHaveBeenCalledWith(productId);
  });

  it("não exige Content-Type (o sendBeacon manda sem corpo)", async () => {
    const request = apiRequest("POST", path);
    expect(request.headers.get("content-type")).toBeNull();

    const response = await POST(request, routeParams({ id: productId }));

    expect(response.status).toBe(204);
  });

  it("TC-24: produto inexistente responde 404", async () => {
    incrementVisits.mockResolvedValue(false);

    const response = await POST(
      apiRequest("POST", path),
      routeParams({ id: productId }),
    );

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("id inválido responde 400", async () => {
    const response = await POST(
      apiRequest("POST", "/api/v1/products/1/visit"),
      routeParams({ id: "1" }),
    );

    expect(response.status).toBe(400);
    expect(incrementVisits).not.toHaveBeenCalled();
  });

  it("recusa requisição de outro site (Origin diferente)", async () => {
    const response = await POST(
      apiRequest("POST", path, { origin: "https://evil.example.com" }),
      routeParams({ id: productId }),
    );

    expect(response.status).toBe(403);
    expect(incrementVisits).not.toHaveBeenCalled();
  });
});
