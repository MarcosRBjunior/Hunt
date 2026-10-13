import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/v1/products/route";
import { voteRepository } from "@/server/repositories";
import type { ApiSuccess, ProductDTO } from "@/types/api";

import { apiRequest, routeParams } from "../helpers/apiRequest";

// Fora do servidor do Next não existe escopo de requisição; o resto do módulo é real.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));

// Sessão do Clerk simulada. Os produtos vêm do mock real (PRODUCT_SOURCE=mock).
const { session } = vi.hoisted(() => ({
  session: {
    current: { userId: null as string | null, sessionClaims: null },
  },
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => session.current }));

const MILO_AI_ID = "a59e45f4-7972-4bf3-ae41-0d6136c45f8c";

beforeEach(() => {
  session.current = { userId: null, sessionClaims: null };
});

async function getProducts() {
  const response = await GET(
    apiRequest("GET", "/api/v1/products"),
    routeParams({}),
  );
  return {
    response,
    body: (await response.json()) as ApiSuccess<ProductDTO[]>,
  };
}

describe("GET /api/v1/products", () => {
  it("responde 200 com os produtos lançados ordenados por votos", async () => {
    const { response, body } = await getProducts();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body.data.map(({ title, upvotes }) => [title, upvotes])).toEqual([
      ["Milo AI", 298],
      ["Layer", 202],
      ["Sunnie", 102],
      ["Orbit", 29],
    ]);
    expect(body.data.every((product) => product.status === "LAUNCHED")).toBe(
      true,
    );
  });

  it("visitante: nenhum produto aparece votado", async () => {
    const { body } = await getProducts();

    expect(body.data.every((product) => !product.viewerHasVoted)).toBe(true);
  });

  it("usuário logado: marca viewerHasVoted nos produtos em que ele votou", async () => {
    session.current = { userId: "user_clerk_1", sessionClaims: null };
    const votedProductIds = vi
      .spyOn(voteRepository, "votedProductIds")
      .mockResolvedValueOnce(new Set([MILO_AI_ID]));

    const { body } = await getProducts();

    expect(votedProductIds).toHaveBeenCalledWith(
      "user_clerk_1",
      expect.arrayContaining([MILO_AI_ID]),
    );
    expect(
      body.data.map(({ title, viewerHasVoted }) => [title, viewerHasVoted]),
    ).toEqual([
      ["Milo AI", true],
      ["Layer", false],
      ["Sunnie", false],
      ["Orbit", false],
    ]);
  });

  it("usuário logado com PRODUCT_SOURCE=mock: lista normal, sem votos", async () => {
    session.current = { userId: "user_clerk_1", sessionClaims: null };

    const { response, body } = await getProducts();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(4);
    expect(body.data.every((product) => !product.viewerHasVoted)).toBe(true);
  });
});
