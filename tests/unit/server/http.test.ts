import { Writable } from "node:stream";

import { describe, expect, it, vi } from "vitest";

import { ConflictError } from "@/server/errors";
import {
  createErrorHandling,
  noContent,
  ok,
  readJson,
  type RequestLog,
} from "@/server/http";
import { createLogger } from "@/server/logger";

function setup() {
  const lines: Record<string, unknown>[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(JSON.parse(chunk.toString()));
      callback();
    },
  });
  const withErrorHandling = createErrorHandling({
    logger: createLogger({ level: "info", destination }),
    generateRequestId: () => "req-123",
  });

  return { withErrorHandling, lines };
}

const URL_VOTE =
  "https://hunt.example.com/api/v1/products/a59e45f4-7972-4bf3-ae41-0d6136c45f8c/vote";

function request(
  method: string,
  headers: Record<string, string> = {},
  init: RequestInit = {},
) {
  return new Request(URL_VOTE, { method, headers, ...init });
}

const sameOrigin = {
  host: "hunt.example.com",
  origin: "https://hunt.example.com",
};

describe("withErrorHandling", () => {
  it("devolve a resposta do handler com o x-request-id", async () => {
    const { withErrorHandling } = setup();
    const handler = withErrorHandling(async () => ok({ hello: "mundo" }));

    const response = await handler(request("GET"), {});

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("req-123");
    expect(await response.json()).toEqual({ data: { hello: "mundo" } });
  });

  it("converte AppError no status e no formato de erro da API", async () => {
    const { withErrorHandling } = setup();
    const handler = withErrorHandling(async () => {
      throw new ConflictError("Você já votou neste produto.", {
        code: "ALREADY_VOTED",
        details: { productId: "abc" },
      });
    });

    const response = await handler(request("POST", sameOrigin), {});

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: {
        code: "ALREADY_VOTED",
        message: "Você já votou neste produto.",
        details: { productId: "abc" },
      },
    });
  });

  it("responde 500 genérico para erro inesperado, sem vazar a mensagem", async () => {
    const { withErrorHandling, lines } = setup();
    const handler = withErrorHandling(async () => {
      throw new Error("senha do banco: hunter2");
    });

    const response = await handler(request("GET"), {});
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: expect.any(String),
        details: {},
      },
    });
    expect(JSON.stringify(body)).not.toContain("hunter2");
    expect(lines[0]).toMatchObject({ level: "error", status: 500 });
  });

  it("registra uma linha JSON por requisição com requestId, rota, status, duração e usuário", async () => {
    const { withErrorHandling, lines } = setup();
    const handler = withErrorHandling(
      async (_request, _context, log: RequestLog) => {
        log.userId = "11111111-1111-4111-8111-111111111111";
        return ok(null, 201);
      },
    );

    await handler(request("POST", sameOrigin), {});

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      level: "info",
      requestId: "req-123",
      method: "POST",
      route: "/api/v1/products/a59e45f4-7972-4bf3-ae41-0d6136c45f8c/vote",
      status: 201,
      userId: "11111111-1111-4111-8111-111111111111",
    });
    expect(lines[0]?.durationMs).toEqual(expect.any(Number));
  });

  it("registra o código do erro nas respostas 4xx", async () => {
    const { withErrorHandling, lines } = setup();
    const handler = withErrorHandling(async () => {
      throw new ConflictError("Já votou.", { code: "ALREADY_VOTED" });
    });

    await handler(request("POST", sameOrigin), {});

    expect(lines[0]).toMatchObject({ status: 409, code: "ALREADY_VOTED" });
  });

  it("repassa o contexto da rota (params) para o handler", async () => {
    const { withErrorHandling } = setup();
    const handler = withErrorHandling(
      async (_request, context: { params: Promise<{ id: string }> }) =>
        ok(await context.params),
    );

    const response = await handler(request("GET"), {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(await response.json()).toEqual({ data: { id: "abc" } });
  });

  describe("conferência de origem nas escritas", () => {
    it.each(["POST", "PUT", "PATCH", "DELETE"])(
      "%s sem header Origin: 403 INVALID_ORIGIN, sem chamar o handler",
      async (method) => {
        const { withErrorHandling } = setup();
        const inner = vi.fn(async () => noContent());

        const response = await withErrorHandling(inner)(
          request(method, { host: "hunt.example.com" }),
          {},
        );

        expect(response.status).toBe(403);
        expect((await response.json()).error.code).toBe("INVALID_ORIGIN");
        expect(inner).not.toHaveBeenCalled();
      },
    );

    it("recusa Origin de outro site", async () => {
      const { withErrorHandling } = setup();
      const inner = vi.fn(async () => noContent());

      const response = await withErrorHandling(inner)(
        request("POST", {
          host: "hunt.example.com",
          origin: "https://evil.example.com",
        }),
        {},
      );

      expect(response.status).toBe(403);
      expect(inner).not.toHaveBeenCalled();
    });

    it("recusa Origin inválido", async () => {
      const { withErrorHandling } = setup();

      const response = await withErrorHandling(async () => noContent())(
        request("POST", { host: "hunt.example.com", origin: "null" }),
        {},
      );

      expect(response.status).toBe(403);
    });

    it("aceita Origin do próprio host", async () => {
      const { withErrorHandling } = setup();

      const response = await withErrorHandling(async () => noContent())(
        request("POST", sameOrigin),
        {},
      );

      expect(response.status).toBe(204);
    });

    it("compara com o x-forwarded-host quando há proxy (Vercel)", async () => {
      const { withErrorHandling } = setup();

      const response = await withErrorHandling(async () => noContent())(
        request("POST", {
          host: "interno.local",
          "x-forwarded-host": "hunt.example.com",
          origin: "https://hunt.example.com",
        }),
        {},
      );

      expect(response.status).toBe(204);
    });

    it("não exige Origin em leituras (GET)", async () => {
      const { withErrorHandling } = setup();

      const response = await withErrorHandling(async () => ok([]))(
        request("GET"),
        {},
      );

      expect(response.status).toBe(200);
    });
  });
});

describe("readJson", () => {
  it("lê o corpo JSON", async () => {
    const body = await readJson(
      request(
        "POST",
        { "content-type": "application/json; charset=utf-8" },
        { body: JSON.stringify({ title: "Layer" }) },
      ),
    );

    expect(body).toEqual({ title: "Layer" });
  });

  it.each([
    ["sem Content-Type", {}],
    ["com Content-Type de formulário", { "content-type": "text/plain" }],
  ])("responde 400 %s", async (_, headers) => {
    const error = await readJson(
      request("POST", headers, { body: '{"title":"Layer"}' }),
    ).catch((e: unknown) => e);

    expect(error).toHaveProperty("status", 400);
  });

  it("responde 400 para JSON malformado", async () => {
    const error = await readJson(
      request(
        "POST",
        { "content-type": "application/json" },
        { body: "{title" },
      ),
    ).catch((e: unknown) => e);

    expect(error).toHaveProperty("status", 400);
  });
});
