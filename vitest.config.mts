import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    env: {
      PRODUCT_SOURCE: "mock",
      LOG_LEVEL: "silent",
    },
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
