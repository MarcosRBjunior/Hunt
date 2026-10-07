import { Writable } from "node:stream";

import { describe, expect, it } from "vitest";

import { createLogger } from "@/server/logger";

function capture(level = "info") {
  const lines: Record<string, unknown>[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(JSON.parse(chunk.toString()));
      callback();
    },
  });

  return { logger: createLogger({ level, destination }), lines };
}

describe("createLogger", () => {
  it("escreve uma linha JSON com nível em texto, horário ISO e mensagem", () => {
    const { logger, lines } = capture();

    logger.info({ requestId: "req-1", route: "/api/v1/products" }, "ok");

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      level: "info",
      msg: "ok",
      requestId: "req-1",
      route: "/api/v1/products",
    });
    expect(new Date(lines[0]?.time as string).toISOString()).toBe(
      lines[0]?.time,
    );
  });

  it("respeita o nível configurado", () => {
    const { logger, lines } = capture("warn");

    logger.info("ignorado");
    logger.warn("registrado");

    expect(lines.map((line) => line.msg)).toEqual(["registrado"]);
  });

  it("nunca registra e-mail, token, cookie ou authorization", () => {
    const { logger, lines } = capture();

    logger.info({
      userId: "user-1",
      email: "ana@exemplo.com",
      token: "abc",
      user: { email: "ana@exemplo.com" },
      headers: { cookie: "__session=xyz", authorization: "Bearer abc" },
    });

    const output = JSON.stringify(lines[0]);
    expect(output).not.toContain("ana@exemplo.com");
    expect(output).not.toContain("__session=xyz");
    expect(output).not.toContain("Bearer abc");
    expect(lines[0]).toMatchObject({ userId: "user-1", token: "[REDACTED]" });
  });
});
