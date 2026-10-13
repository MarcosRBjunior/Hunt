import type { Logger } from "pino";

import type { HealthDTO } from "@/types/api";

import { getPrisma } from "../db";
import { env } from "../env";
import { ServiceUnavailableError } from "../errors";
import { logger as defaultLogger } from "../logger";

type Dependencies = {
  productSource: "mock" | "prisma";
  /** Consulta mínima ao banco; rejeita se ele não responder. */
  pingDatabase: () => Promise<unknown>;
  logger: Pick<Logger, "error">;
};

/** `GET /api/health`: 200 com o banco respondendo, 503 sem ele. */
export function createHealthService({
  productSource,
  pingDatabase,
  logger,
}: Dependencies) {
  return {
    async check(): Promise<HealthDTO> {
      // Com o mock, o app não usa banco nenhum.
      if (productSource !== "prisma") {
        return { status: "ok", database: "skipped" };
      }

      try {
        await pingDatabase();
      } catch (error) {
        logger.error({ err: error }, "health: banco indisponível");
        throw new ServiceUnavailableError("Banco de dados indisponível.", {
          code: "DATABASE_UNAVAILABLE",
        });
      }

      return { status: "ok", database: "ok" };
    },
  };
}

export const healthService = createHealthService({
  productSource: env.PRODUCT_SOURCE,
  pingDatabase: () => getPrisma().$queryRaw`SELECT 1`,
  logger: defaultLogger,
});
