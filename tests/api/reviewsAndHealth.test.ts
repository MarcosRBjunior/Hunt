import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as health } from "@/app/api/health/route";
import { PUT } from "@/app/api/v1/admin/products/[id]/review/route";
import { GET as reviewed } from "@/app/api/v1/products/reviewed/route";
import { GET as upcoming } from "@/app/api/v1/products/upcoming/route";
import type { ProductRepository } from "@/server/repositories/productRepository";
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
    userRepository: {},
  },
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => session.current }));
vi.mock("@/server/repositories", () => repositories);
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));

const id = "a59e45f4-7972-4bf3-ae41-0d6136c45f8c";
const reviewPath = `/api/v1/admin/products/${id}/review`;

const listReviewed = vi.fn<ProductRepository["listReviewed"]>();
const listUpcoming = vi.fn<ProductRepository["listUpcoming"]>();
const upsertReview = vi.fn<ProductRepository["upsertReview"]>();

function signedInAs(role?: "admin") {
  session.current = {
    userId: "user_1",
    sessionClaims: role ? { metadata: { role } } : {},
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  session.current = { userId: null, sessionClaims: null };
  listReviewed.mockResolvedValue([
    {
      ...buildProduct({ id, title: "Layer" }),
      review: { rating: 5, summary: "Ótimo" },
    },
  ]);
  listUpcoming.mockResolvedValue([buildProduct({ status: "UPCOMING" })]);
  upsertReview.mockImplementation(async (_productId, review) => review);
  Object.assign(
    repositories.productRepository,
    stubProductRepository({ listReviewed, listUpcoming, upsertReview }),
  );
  Object.assign(repositories.voteRepository, stubVoteRepository());
});

describe("GET /api/v1/products/reviewed", () => {
  it("devolve os revisados com a nota, até 3 por padrão", async () => {
    const response = await reviewed(
      apiRequest("GET", "/api/v1/products/reviewed"),
      {},
    );

    expect(response.status).toBe(200);
    expect(listReviewed).toHaveBeenCalledWith(3);
    expect((await response.json()).data[0]).toMatchObject({
      id,
      title: "Layer",
      review: { rating: 5, summary: "Ótimo" },
    });
  });

  it("repassa o ?limit= válido e troca o inválido pelo padrão", async () => {
    await reviewed(apiRequest("GET", "/api/v1/products/reviewed?limit=5"), {});
    const response = await reviewed(
      apiRequest("GET", "/api/v1/products/reviewed?limit=999"),
      {},
    );

    expect(response.status).toBe(200);
    expect(listReviewed.mock.calls).toEqual([[5], [3]]);
  });
});

describe("GET /api/v1/products/upcoming", () => {
  it("devolve os produtos em breve, sem precisar de login", async () => {
    const response = await upcoming(
      apiRequest("GET", "/api/v1/products/upcoming"),
      {},
    );

    expect(response.status).toBe(200);
    expect((await response.json()).data[0]).toMatchObject({
      status: "UPCOMING",
    });
  });
});

describe("PUT /api/v1/admin/products/{id}/review", () => {
  const body = { rating: 4, summary: "Promissor" };

  it("visitante recebe 401 e nada é gravado", async () => {
    const response = await PUT(
      apiRequest("PUT", reviewPath, { body }),
      routeParams({ id }),
    );

    expect(response.status).toBe(401);
    expect(upsertReview).not.toHaveBeenCalled();
  });

  it("usuário comum recebe 403 e nada é gravado", async () => {
    signedInAs();

    const response = await PUT(
      apiRequest("PUT", reviewPath, { body }),
      routeParams({ id }),
    );

    expect(response.status).toBe(403);
    expect(upsertReview).not.toHaveBeenCalled();
  });

  it("admin grava a revisão e recebe 200 com ela", async () => {
    signedInAs("admin");

    const response = await PUT(
      apiRequest("PUT", reviewPath, { body }),
      routeParams({ id }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: body });
    expect(upsertReview).toHaveBeenCalledWith(id, body);
  });

  it("nota fora de 1 a 5 responde 400 no campo rating", async () => {
    signedInAs("admin");

    const response = await PUT(
      apiRequest("PUT", reviewPath, { body: { rating: 9 } }),
      routeParams({ id }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.details.fields).toHaveProperty(
      "rating",
    );
  });

  it("produto inexistente responde 404", async () => {
    signedInAs("admin");
    upsertReview.mockResolvedValue(null);

    const response = await PUT(
      apiRequest("PUT", reviewPath, { body }),
      routeParams({ id }),
    );

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("de outro site (Origin estranho) responde 403 INVALID_ORIGIN", async () => {
    signedInAs("admin");

    const response = await PUT(
      apiRequest("PUT", reviewPath, {
        body,
        origin: "https://evil.example.com",
      }),
      routeParams({ id }),
    );

    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("INVALID_ORIGIN");
    expect(upsertReview).not.toHaveBeenCalled();
  });
});

describe("GET /api/health", () => {
  it("responde 200 sem cache (com o mock, o banco nem é consultado)", async () => {
    const response = await health(apiRequest("GET", "/api/health"), {});

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      data: { status: "ok", database: "skipped" },
    });
  });
});
