import { describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/v1/products/route";
import type { ApiSuccess, ProductDTO } from "@/types/api";

// Fora do servidor do Next não existe escopo de requisição; o resto do módulo é real.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));

describe("GET /api/v1/products", () => {
  it("responde 200 com os produtos lançados ordenados por votos", async () => {
    const response = await GET();
    const body = (await response.json()) as ApiSuccess<ProductDTO[]>;

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
});
