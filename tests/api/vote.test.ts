import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, POST } from "@/app/api/v1/products/[id]/vote/route";
import type { ProductRepository } from "@/server/repositories/productRepository";
import type { UserRepository } from "@/server/repositories/userRepository";
import type { VoteRepository } from "@/server/repositories/voteRepository";

import { apiRequest, routeParams } from "../helpers/apiRequest";
import { buildProduct } from "../helpers/buildProduct";
import {
  stubProductRepository,
  stubVoteRepository,
} from "../helpers/stubRepositories";

// Só a sessão do Clerk e o banco são simulados; handler, auth e serviços são reais.
const { session, repositories } = vi.hoisted(() => ({
  session: {
    current: { userId: null, sessionClaims: null } as {
      userId: string | null;
      sessionClaims: Record<string, unknown> | null;
    },
  },
  repositories: {
    productRepository: {} as ProductRepository,
    voteRepository: {} as VoteRepository,
    userRepository: {} as UserRepository,
  },
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => session.current }));
vi.mock("@/server/repositories", () => repositories);

const productId = "a59e45f4-7972-4bf3-ae41-0d6136c45f8c";
const internalUserId = "11111111-1111-4111-8111-111111111111";
const path = `/api/v1/products/${productId}/vote`;

const add = vi.fn<VoteRepository["add"]>();
const remove = vi.fn<VoteRepository["remove"]>();
const upsertByExternalId = vi.fn<UserRepository["upsertByExternalId"]>();

beforeEach(() => {
  vi.clearAllMocks();
  session.current = { userId: null, sessionClaims: null };
  Object.assign(
    repositories.productRepository,
    stubProductRepository({
      findById: async (id) => buildProduct({ id, upvotes: 10 }),
    }),
  );
  Object.assign(
    repositories.voteRepository,
    stubVoteRepository({ add, remove }),
  );
  repositories.userRepository.upsertByExternalId = upsertByExternalId;
  upsertByExternalId.mockImplementation(async (externalId) => ({
    id: internalUserId,
    externalId,
  }));
  add.mockResolvedValue({ status: "created", upvotes: 11 });
  remove.mockResolvedValue({ upvotes: 9 });
});

function signIn() {
  session.current = { userId: "user_clerk_1", sessionClaims: {} };
}

describe("POST /api/v1/products/{id}/vote", () => {
  it("TC-04: sem sessão responde 401 e não grava nada", async () => {
    const response = await POST(
      apiRequest("POST", path),
      routeParams({ id: productId }),
    );

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("UNAUTHENTICATED");
    expect(add).not.toHaveBeenCalled();
    expect(upsertByExternalId).not.toHaveBeenCalled();
  });

  it("vota com o id interno do usuário e responde 201 com o novo total", async () => {
    signIn();

    const response = await POST(
      apiRequest("POST", path),
      routeParams({ id: productId }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      data: { productId, upvotes: 11, viewerHasVoted: true },
    });
    expect(upsertByExternalId).toHaveBeenCalledWith("user_clerk_1");
    expect(add).toHaveBeenCalledWith(internalUserId, productId);
  });

  it("recusa requisição sem Origin (CSRF) mesmo com sessão, sem gravar", async () => {
    signIn();

    const response = await POST(
      apiRequest("POST", path, { origin: null }),
      routeParams({ id: productId }),
    );

    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("INVALID_ORIGIN");
    expect(add).not.toHaveBeenCalled();
  });

  it("TC-06: voto repetido responde 409 ALREADY_VOTED", async () => {
    signIn();
    add.mockResolvedValue({ status: "duplicate" });

    const response = await POST(
      apiRequest("POST", path),
      routeParams({ id: productId }),
    );

    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("ALREADY_VOTED");
  });

  it("TC-09: produto UPCOMING responde 422 PRODUCT_NOT_VOTABLE", async () => {
    signIn();
    repositories.productRepository.findById = async (id) =>
      buildProduct({ id, status: "UPCOMING" });

    const response = await POST(
      apiRequest("POST", path),
      routeParams({ id: productId }),
    );

    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("PRODUCT_NOT_VOTABLE");
  });

  it("produto inexistente responde 404 e id inválido responde 400", async () => {
    signIn();
    repositories.productRepository.findById = async () => null;

    const missing = await POST(
      apiRequest("POST", path),
      routeParams({ id: productId }),
    );
    const invalid = await POST(
      apiRequest("POST", "/api/v1/products/abc/vote"),
      routeParams({ id: "abc" }),
    );

    expect(missing.status).toBe(404);
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).error.details.fields).toHaveProperty("id");
  });
});

describe("DELETE /api/v1/products/{id}/vote", () => {
  it("remove o voto e responde 200 com o botão inativo", async () => {
    signIn();

    const response = await DELETE(
      apiRequest("DELETE", path),
      routeParams({ id: productId }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: { productId, upvotes: 9, viewerHasVoted: false },
    });
    expect(remove).toHaveBeenCalledWith(internalUserId, productId);
  });

  it("TC-08: sem voto para remover responde 404 VOTE_NOT_FOUND", async () => {
    signIn();
    remove.mockResolvedValue(null);

    const response = await DELETE(
      apiRequest("DELETE", path),
      routeParams({ id: productId }),
    );

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("VOTE_NOT_FOUND");
  });

  it("sem sessão responde 401", async () => {
    const response = await DELETE(
      apiRequest("DELETE", path),
      routeParams({ id: productId }),
    );

    expect(response.status).toBe(401);
    expect(remove).not.toHaveBeenCalled();
  });
});
