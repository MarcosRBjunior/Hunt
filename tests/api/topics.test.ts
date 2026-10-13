import { describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/v1/topics/route";
import type { ApiSuccess, TopicWithCountDTO } from "@/types/api";

import { apiRequest, routeParams } from "../helpers/apiRequest";

// Fora do servidor do Next não existe escopo de requisição; o resto do módulo é real.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));

describe("GET /api/v1/topics", () => {
  it("responde 200 com os 5 topics em ordem alfabética e a contagem de lançados", async () => {
    const response = await GET(
      apiRequest("GET", "/api/v1/topics"),
      routeParams({}),
    );
    const body = (await response.json()) as ApiSuccess<TopicWithCountDTO[]>;

    expect(response.status).toBe(200);
    expect(body.data).toEqual([
      { slug: "ia", name: "Inteligência artificial", productCount: 1 },
      { slug: "marketing", name: "Marketing", productCount: 1 },
      { slug: "produtividade", name: "Produtividade", productCount: 2 },
      { slug: "saas", name: "SaaS", productCount: 3 },
      { slug: "tech", name: "Tech", productCount: 1 },
    ]);
  });
});
