/**
 * Banco dos testes de integração. Local: o Postgres do docker-compose
 * (`npm run db:up`). No CI: o service container (via TEST_DATABASE_URL).
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://hunt:hunt@localhost:5435/hunt_test";

/**
 * Os testes apagam tabelas inteiras: só rodam num banco cujo nome termina em
 * `_test`, para nunca encostar no de desenvolvimento ou no de produção.
 */
export function assertTestDatabase(url: string): URL {
  const parsed = new URL(url);
  const name = parsed.pathname.slice(1);

  if (!/^[a-z0-9_]+_test$/.test(name)) {
    throw new Error(
      `Os testes de integração só rodam num banco "*_test" (recebido: "${name}")`,
    );
  }

  return parsed;
}
