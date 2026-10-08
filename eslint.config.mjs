import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      // Segurança: HTML cru é proibido no projeto (CLAUDE.md › Segurança).
      "react/no-danger": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { ignoreRestSiblings: true },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    // Prisma Client gerado por `prisma generate`.
    "src/generated/**",
    // Referência do Figma Make (app Vite separado), fora do projeto.
    "docs/**",
  ]),
]);

export default eslintConfig;
