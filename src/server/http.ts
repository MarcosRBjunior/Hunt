import { randomUUID } from "node:crypto";

import type { Logger } from "pino";

import type { ApiError, ApiSuccess } from "@/types/api";

import { AppError, ForbiddenError, ValidationError } from "./errors";
import { logger as defaultLogger } from "./logger";

/** O que o handler conta para o log da requisição. */
export type RequestLog = {
  /** Id interno do usuário (tabela `users`), nunca e-mail ou token. */
  userId?: string;
};

type Handler<Context> = (
  request: Request,
  context: Context,
  log: RequestLog,
) => Promise<Response>;

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ data } satisfies ApiSuccess<T>, { status });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

function errorResponse(status: number, error: ApiError["error"]): Response {
  return Response.json({ error } satisfies ApiError, { status });
}

function hostOf(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

/**
 * Proteção contra CSRF: a escrita precisa vir de uma página do próprio site.
 * Mesmo critério das Server Actions do Next: o host do `Origin` tem de bater
 * com o `x-forwarded-host` (proxy da Vercel) ou com o `host`. Sem `Origin`,
 * recusa (CLAUDE.md › Segurança).
 */
function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const originHost = origin ? hostOf(origin) : null;
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = request.headers.get("host");

  if (!originHost || (originHost !== forwardedHost && originHost !== host)) {
    throw new ForbiddenError("Origem da requisição não permitida.", {
      code: "INVALID_ORIGIN",
    });
  }
}

/** Corpo JSON das escritas; outro Content-Type ou JSON malformado dá 400. */
export async function readJson(request: Request): Promise<unknown> {
  const mediaType = request.headers
    .get("content-type")
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();

  if (mediaType !== "application/json") {
    throw new ValidationError(
      "Envie o corpo em JSON (Content-Type: application/json).",
    );
  }

  try {
    return await request.json();
  } catch {
    throw new ValidationError("JSON inválido.");
  }
}

type Dependencies = {
  logger: Logger;
  generateRequestId?: () => string;
};

export function createErrorHandling({
  logger,
  generateRequestId = randomUUID,
}: Dependencies) {
  /**
   * Envolve um route handler: confere a origem das escritas, converte
   * `AppError` no formato de erro da API (qualquer outro erro vira 500
   * genérico) e grava uma linha de log JSON por requisição.
   */
  return function withErrorHandling<Context>(handler: Handler<Context>) {
    return async (request: Request, context: Context): Promise<Response> => {
      const startedAt = performance.now();
      const requestId = generateRequestId();
      const log: RequestLog = {};
      let response: Response;
      let code: string | undefined;
      let unexpected: unknown;

      try {
        if (WRITE_METHODS.has(request.method)) assertSameOrigin(request);
        response = await handler(request, context, log);
      } catch (error) {
        if (error instanceof AppError) {
          code = error.code;
          response = errorResponse(error.status, {
            code: error.code,
            message: error.message,
            details: error.details,
          });
        } else {
          unexpected = error;
          code = "INTERNAL_ERROR";
          response = errorResponse(500, {
            code,
            message: "Erro interno. Tente novamente em instantes.",
            details: {},
          });
        }
      }

      response.headers.set("x-request-id", requestId);

      const entry = {
        requestId,
        method: request.method,
        route: new URL(request.url).pathname,
        status: response.status,
        code,
        durationMs: Math.round(performance.now() - startedAt),
        userId: log.userId,
      };
      if (unexpected) logger.error({ ...entry, err: unexpected }, "request");
      else logger.info(entry, "request");

      return response;
    };
  };
}

export const withErrorHandling = createErrorHandling({
  logger: defaultLogger,
});
