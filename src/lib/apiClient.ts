import type { ApiError, ApiSuccess } from "@/types/api";

/** Erro devolvido pela API (`{ error: { code, message, details } }`) ou pela rede. */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Mensagens por campo de um 400 de validação (`details.fields`). */
  get fieldErrors(): Record<string, string[]> {
    const fields = this.details.fields;
    return fields && typeof fields === "object"
      ? (fields as Record<string, string[]>)
      : {};
  }
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Vai como JSON. Sem body, a requisição sai sem Content-Type. */
  body?: unknown;
};

/**
 * `fetch` para a API do próprio site: devolve o `data` da resposta (ou
 * `undefined` no 204) e lança `ApiClientError` em qualquer falha.
 */
export async function apiFetch<T>(
  path: string,
  { method = "GET", body }: Options = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError(
      0,
      "NETWORK_ERROR",
      "Sem conexão com o servidor. Tente de novo.",
    );
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as
    ApiSuccess<T> | ApiError | null;

  if (response.ok && payload && "data" in payload) return payload.data;

  const error = payload && "error" in payload ? payload.error : null;
  throw new ApiClientError(
    response.status,
    error?.code ?? "UNEXPECTED_RESPONSE",
    error?.message ?? "Erro inesperado. Tente de novo.",
    error?.details,
  );
}
