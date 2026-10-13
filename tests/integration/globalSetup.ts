import { execFileSync } from "node:child_process";

import { Client } from "pg";

import { assertTestDatabase, TEST_DATABASE_URL } from "./testDatabase";

/** Cria o banco de teste se faltar e aplica as migrations (com os CHECKs). */
export default async function setup() {
  const url = assertTestDatabase(TEST_DATABASE_URL);
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

  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, DIRECT_URL: "" },
    stdio: "pipe",
  });
}
