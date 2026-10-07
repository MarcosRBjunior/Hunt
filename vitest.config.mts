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
    },
    // Testes .ts rodam em Node; testes .tsx (componentes) rodam no jsdom.
    projects: [
      {
        extends: true,
        test: {
          name: "server",
          include: ["tests/**/*.test.ts"],
          environment: "node",
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
