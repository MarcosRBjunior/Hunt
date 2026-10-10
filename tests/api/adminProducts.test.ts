import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, PATCH } from "@/app/api/v1/admin/products/[id]/route";
import { GET, POST } from "@/app/api/v1/admin/products/route";
import type {
  NewProduct,
  ProductRepository,
} from "@/server/repositories/productRepository";
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
// Fora do servidor do Next não existe escopo de requisição.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));

const id = "a59e45f4-7972-4bf3-ae41-0d6136c45f8c";
const listPath = "/api/v1/admin/products";
const itemPath = `${listPath}/${id}`;
const validBody = {
  title: "Layer",
  description: "A API visual.",
  url: "https://layer.example.com",
};

const create = vi.fn<ProductRepository["create"]>();
const update = vi.fn<ProductRepository["update"]>();
const remove = vi.fn<ProductRepository["delete"]>();

beforeEach(() => {
  vi.clearAllMocks();
  session.current = { userId: null, sessionClaims: null };
  create.mockImplementation(async ({ topicSlugs, ...product }: NewProduct) =>
    buildProduct({
      ...product,
      id,
      topics: topicSlugs.map((slug) => ({ slug, name: slug })),
    }),
  );
  update.mockImplementation(async (productId, changes) =>
    buildProduct({ id: productId, title: changes.title ?? "Layer" }),
  );
  remove.mockResolvedValue(true);
  Object.assign(
    repositories.productRepository,
    stubProductRepository({
      listAll: async () => [buildProduct({ id, title: "Layer" })],
      create,
      update,
      delete: remove,
    }),
  );
  Object.assign(repositories.voteRepository, stubVoteRepository());
});

function signInAs(role: "admin" | "user") {
  session.current = {
    userId: "user_clerk_1",
    sessionClaims: role === "admin" ? { metadata: { role: "admin" } } : {},
  };
}

describe("permissões da área admin", () => {
  it("visitante recebe 401", async () => {
    const response = await GET(apiRequest("GET", listPath), routeParams({}));

    expect(response.status).toBe(401);
  });

  it("TC-10: usuário comum recebe 403 em todas as rotas e nada é gravado", async () => {
    signInAs("user");

    const responses = await Promise.all([
      GET(apiRequest("GET", listPath), routeParams({})),
      POST(apiRequest("POST", listPath, { body: validBody }), routeParams({})),
      PATCH(
        apiRequest("PATCH", itemPath, { body: { title: "X" } }),
        routeParams({ id }),
      ),
      DELETE(apiRequest("DELETE", itemPath), routeParams({ id })),
    ]);

    expect(responses.map((response) => response.status)).toEqual([
      403, 403, 403, 403,
    ]);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("papel em unsafeMetadata não dá acesso de admin", async () => {
    session.current = {
      userId: "user_clerk_1",
      sessionClaims: { unsafe_metadata: { role: "admin" } },
    };

    const response = await POST(
      apiRequest("POST", listPath, { body: validBody }),
      routeParams({}),
    );

    expect(response.status).toBe(403);
    expect(create).not.toHaveBeenCalled();
  });
});

describe("GET /api/v1/admin/products", () => {
  it("admin recebe a lista com 200", async () => {
    signInAs("admin");

    const response = await GET(apiRequest("GET", listPath), routeParams({}));

    expect(response.status).toBe(200);
    expect(
      (await response.json()).data.map((p: { title: string }) => p.title),
    ).toEqual(["Layer"]);
  });
});

describe("POST /api/v1/admin/products", () => {
  it("cria o produto e responde 201", async () => {
    signInAs("admin");

    const response = await POST(
      apiRequest("POST", listPath, {
        body: { ...validBody, topicSlugs: ["saas"] },
      }),
      routeParams({}),
    );

    expect(response.status).toBe(201);
    expect((await response.json()).data).toMatchObject({
      id,
      title: "Layer",
      upvotes: 0,
    });
  });

  it("TC-11: upvotes: 500 no body não chega ao banco", async () => {
    signInAs("admin");

    await POST(
      apiRequest("POST", listPath, { body: { ...validBody, upvotes: 500 } }),
      routeParams({}),
    );

    expect(create.mock.calls[0]?.[0]).not.toHaveProperty("upvotes");
  });

  it("TC-12: url javascript: responde 400 apontando o campo url", async () => {
    signInAs("admin");

    const response = await POST(
      apiRequest("POST", listPath, {
        body: { ...validBody, url: "javascript:alert(1)" },
      }),
      routeParams({}),
    );
    const { error } = await response.json();

    expect(response.status).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(error.details.fields)).toEqual(["url"]);
    expect(create).not.toHaveBeenCalled();
  });

  it("corpo que não é JSON responde 400", async () => {
    signInAs("admin");

    const response = await POST(
      apiRequest("POST", listPath, {
        body: "title=Layer",
        contentType: "application/x-www-form-urlencoded",
      }),
      routeParams({}),
    );

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/v1/admin/products/{id}", () => {
  it("admin edita e recebe 200", async () => {
    signInAs("admin");

    const response = await PATCH(
      apiRequest("PATCH", itemPath, { body: { title: "Layer 2" } }),
      routeParams({ id }),
    );

    expect(response.status).toBe(200);
    expect((await response.json()).data.title).toBe("Layer 2");
  });

  it("TC-25: visits: 999 no PATCH é ignorado", async () => {
    signInAs("admin");

    await PATCH(
      apiRequest("PATCH", itemPath, { body: { visits: 999 } }),
      routeParams({ id }),
    );

    expect(update).toHaveBeenCalledWith(id, {});
  });

  it("produto inexistente responde 404", async () => {
    signInAs("admin");
    update.mockResolvedValue(null);

    const response = await PATCH(
      apiRequest("PATCH", itemPath, { body: { title: "X" } }),
      routeParams({ id }),
    );

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/v1/admin/products/{id}", () => {
  it("admin remove e recebe 204 sem corpo", async () => {
    signInAs("admin");

    const response = await DELETE(
      apiRequest("DELETE", itemPath),
      routeParams({ id }),
    );

    expect(response.status).toBe(204);
    expect(remove).toHaveBeenCalledWith(id);
  });

  it("produto inexistente responde 404", async () => {
    signInAs("admin");
    remove.mockResolvedValue(false);

    const response = await DELETE(
      apiRequest("DELETE", itemPath),
      routeParams({ id }),
    );

    expect(response.status).toBe(404);
  });
});
