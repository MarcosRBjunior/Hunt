import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiClientError, apiFetch } from "@/lib/apiClient";

function respondWith(status: number, body?: unknown) {
  const fetch = vi.fn(
    async () =>
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("devolve o data da resposta de sucesso", async () => {
    respondWith(200, { data: { upvotes: 3 } });

    expect(await apiFetch("/api/v1/x")).toEqual({ upvotes: 3 });
  });

  it("manda o body como JSON, com Content-Type", async () => {
    const fetch = respondWith(201, { data: {} });

    await apiFetch("/api/v1/admin/products", {
      method: "POST",
      body: { title: "Layer" },
    });

    expect(fetch).toHaveBeenCalledWith("/api/v1/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"title":"Layer"}',
    });
  });

  it("sem body, não manda Content-Type", async () => {
    const fetch = respondWith(201, { data: {} });

    await apiFetch("/api/v1/products/1/vote", { method: "POST" });

    expect(fetch).toHaveBeenCalledWith("/api/v1/products/1/vote", {
      method: "POST",
      headers: undefined,
      body: undefined,
    });
  });

  it("devolve undefined no 204", async () => {
    respondWith(204);

    expect(
      await apiFetch("/api/v1/admin/products/1", { method: "DELETE" }),
    ).toBeUndefined();
  });

  it("converte o erro da API, com as mensagens por campo", async () => {
    respondWith(400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        details: { fields: { url: ["Use http(s)."] } },
      },
    });

    const error = await apiFetch("/api/v1/x").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
      fieldErrors: { url: ["Use http(s)."] },
    });
  });

  it("resposta de erro sem o formato da API vira erro genérico", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>", { status: 502 })),
    );

    const error = await apiFetch("/api/v1/x").catch((e: unknown) => e);

    expect(error).toMatchObject({
      status: 502,
      code: "UNEXPECTED_RESPONSE",
      fieldErrors: {},
    });
  });

  it("falha de rede vira NETWORK_ERROR", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    await expect(apiFetch("/api/v1/x")).rejects.toMatchObject({
      status: 0,
      code: "NETWORK_ERROR",
    });
  });
});
