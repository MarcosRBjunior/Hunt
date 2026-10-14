import { execFileSync } from "node:child_process";

import { Client } from "pg";

/**
 * Banco dos testes E2E. Local: o Postgres do docker-compose (`npm run db:up`).
 * No CI: o service container (via E2E_DATABASE_URL). É uma função porque o
 * playwright.config.ts só carrega os `.env*` depois dos imports.
 */
export function e2eDatabaseUrl(): string {
  return (
    process.env.E2E_DATABASE_URL ??
    "postgresql://hunt:hunt@localhost:5435/hunt_e2e"
  );
}

/**
 * A preparação apaga o banco inteiro: só roda num banco cujo nome termina em
 * `_e2e`, para nunca encostar no de desenvolvimento ou no de produção.
 */
function assertE2eDatabase(url: string): URL {
  const parsed = new URL(url);
  const name = parsed.pathname.slice(1);

  if (!/^[a-z0-9_]+_e2e$/.test(name)) {
    throw new Error(
      `Os testes E2E só rodam num banco "*_e2e" (recebido: "${name}")`,
    );
  }

  return parsed;
}

/**
 * Deixa o banco igual em toda execução: cria se faltar, aplica as migrations,
 * apaga todos os dados e roda o seed da demo (os produtos de
 * `src/mocks/products.json`, com votos fictícios).
 */
export async function resetE2eDatabase(): Promise<void> {
  const databaseUrl = e2eDatabaseUrl();
  const url = assertE2eDatabase(databaseUrl);
  const name = url.pathname.slice(1);

  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [name],
    );
    // O nome já passou pela validação acima (só [a-z0-9_]).
    if (!rowCount) await admin.query(`CREATE DATABASE "${name}"`);
  } finally {
    await admin.end();
  }

  // DIRECT_URL vazia: senão o Prisma usaria a do .env.local (banco de dev).
  const env = { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: "" };
  execFileSync("npx", ["prisma", "migrate", "deploy"], { env, stdio: "pipe" });

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(
      "TRUNCATE editorial_reviews, product_topics, votes, products, topics, users CASCADE",
    );
  } finally {
    await client.end();
  }

  execFileSync("npx", ["prisma", "db", "seed"], {
    // Só a demo, mesmo com SEED_BULK=true no .env.local.
    env: { ...env, SEED_DEMO: "true", SEED_BULK: "false" },
    stdio: "pipe",
  });
}
