import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    env: {
      PRODUCT_SOURCE: "mock",
      LOG_LEVEL: "silent",
      // Chaves fictícias em formato válido: os testes nunca falam com o Clerk.
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        "pk_test_ZXhhbXBsZS5jbGVyay5hY2NvdW50cy5kZXYk",
      CLERK_SECRET_KEY: "sk_test_fake",
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
    },
    // Testes .ts rodam em Node; testes .tsx (componentes) rodam no jsdom.
    // Os de integração precisam do Postgres e rodam à parte
    // (`npm run test:integration`).
    projects: [
      {
        extends: true,
        test: {
          name: "server",
          include: ["tests/**/*.test.ts"],
          exclude: ["tests/integration/**"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          globalSetup: ["tests/integration/globalSetup.ts"],
          // Um banco só para todos os arquivos: um arquivo por vez.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
      {
        extends: true,
        test: {
          name: "components",
          include: ["tests/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["tests/setup/dom.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/server/services/**/*.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
