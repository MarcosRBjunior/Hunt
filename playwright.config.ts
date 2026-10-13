import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

import { e2eDatabaseUrl } from "./tests/e2e/support/database";

// Mesmos arquivos que o Next (`.env.local` etc.), sem sobrescrever o que já
// veio do ambiente. Localmente, as chaves do Clerk de desenvolvimento vêm daí.
loadEnvConfig(process.cwd());

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global.setup.ts",
  // Um banco só e votos de verdade: um teste por vez, sem repetição (a
  // segunda tentativa já encontraria o voto gravado).
  workers: 1,
  fullyParallel: false,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Build novo a cada execução, para nunca testar um build antigo. O servidor
  // sobe antes do globalSetup: a espera usa /sobre, que não depende do banco.
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `${baseURL}/sobre`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      PRODUCT_SOURCE: "prisma",
      DATABASE_URL: e2eDatabaseUrl(),
      DIRECT_URL: "",
      LOG_LEVEL: "warn",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
