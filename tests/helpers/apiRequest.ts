const SITE = "https://hunt.example.com";

type Options = {
  /** Objeto vira JSON; string vai como está. */
  body?: unknown;
  /** `null` tira o header Origin (requisição de fora do navegador). */
  origin?: string | null;
  contentType?: string;
};

/** Requisição como o navegador mandaria de uma página do próprio site. */
export function apiRequest(
  method: string,
  path: string,
  { body, origin = SITE, contentType = "application/json" }: Options = {},
): Request {
  const headers: Record<string, string> = { host: new URL(SITE).host };
  if (origin) headers.origin = origin;
  if (body !== undefined) headers["content-type"] = contentType;

  return new Request(`${SITE}${path}`, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });
}

/** Segundo argumento dos route handlers dinâmicos (`[id]`). */
export function routeParams<Params>(params: Params) {
  return { params: Promise.resolve(params) };
}
