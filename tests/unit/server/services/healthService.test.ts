import { describe, expect, it, vi } from "vitest";

import { ServiceUnavailableError } from "@/server/errors";
import { createHealthService } from "@/server/services/healthService";

function serviceWith(
  productSource: "mock" | "prisma",
  pingDatabase: () => Promise<unknown>,
) {
  const logger = { error: vi.fn() };
  return {
    service: createHealthService({ productSource, pingDatabase, logger }),
    logger,
  };
}

describe("healthService.check", () => {
  it("com o banco respondendo, está ok", async () => {
    const ping = vi.fn(async () => [{ "?column?": 1 }]);
    const { service } = serviceWith("prisma", ping);

    expect(await service.check()).toEqual({ status: "ok", database: "ok" });
    expect(ping).toHaveBeenCalledOnce();
  });

  it("sem o banco, responde 503 e registra o erro", async () => {
    const failure = new Error("connection refused");
    const { service, logger } = serviceWith("prisma", async () => {
      throw failure;
    });

    const error = await service.check().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ServiceUnavailableError);
    expect(error).toMatchObject({ status: 503, code: "DATABASE_UNAVAILABLE" });
    expect(logger.error).toHaveBeenCalledWith(
      { err: failure },
      "health: banco indisponível",
    );
  });

  it("com o mock, não toca no banco", async () => {
    const ping = vi.fn();
    const { service } = serviceWith("mock", ping);

    expect(await service.check()).toEqual({
      status: "ok",
      database: "skipped",
    });
    expect(ping).not.toHaveBeenCalled();
  });
});
