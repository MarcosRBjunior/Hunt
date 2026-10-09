import { describe, expect, it } from "vitest";

import { parseEnv } from "@/server/env";

const valid = {
  PRODUCT_SOURCE: "mock",
  LOG_LEVEL: "info",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    "pk_test_ZXhhbXBsZS5jbGVyay5hY2NvdW50cy5kZXYk",
  CLERK_SECRET_KEY: "sk_test_fake",
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
};
const databaseUrl = "postgresql://hunt:hunt@localhost:5435/hunt";

describe("parseEnv", () => {
  it("aceita um ambiente válido", () => {
    expect(parseEnv(valid)).toEqual(valid);
  });

  it("aceita PRODUCT_SOURCE=prisma com DATABASE_URL", () => {
    const source = {
      ...valid,
      PRODUCT_SOURCE: "prisma",
      DATABASE_URL: databaseUrl,
    };

    expect(parseEnv(source)).toEqual(source);
  });

  it("falha com PRODUCT_SOURCE=prisma sem DATABASE_URL", () => {
    expect(() => parseEnv({ ...valid, PRODUCT_SOURCE: "prisma" })).toThrow(
      "DATABASE_URL",
    );
  });

  it("trata DATABASE_URL vazia (como no .env.example) como ausente", () => {
    expect(parseEnv({ ...valid, DATABASE_URL: "", DIRECT_URL: "" })).toEqual(
      valid,
    );
    expect(() =>
      parseEnv({ ...valid, PRODUCT_SOURCE: "prisma", DATABASE_URL: "" }),
    ).toThrow("DATABASE_URL");
  });

  it.each(["DATABASE_URL", "DIRECT_URL"])(
    "falha com %s que não seja postgres(ql)://",
    (name) => {
      expect(() =>
        parseEnv({ ...valid, [name]: "mysql://u:p@localhost:3306/db" }),
      ).toThrow(name);
    },
  );

  it("ignora variáveis que não fazem parte do schema", () => {
    expect(parseEnv({ ...valid, PATH: "/usr/bin" })).toEqual(valid);
  });

  it.each([
    "PRODUCT_SOURCE",
    "LOG_LEVEL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
    "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
  ])("falha quando %s está ausente", (name) => {
    const source: Record<string, string | undefined> = { ...valid };
    delete source[name];

    expect(() => parseEnv(source)).toThrow(name);
  });

  it("falha com PRODUCT_SOURCE fora de mock|prisma", () => {
    expect(() => parseEnv({ ...valid, PRODUCT_SOURCE: "supabase" })).toThrow(
      "PRODUCT_SOURCE",
    );
  });

  it("falha com LOG_LEVEL desconhecido do pino", () => {
    expect(() => parseEnv({ ...valid, LOG_LEVEL: "verbose" })).toThrow(
      "LOG_LEVEL",
    );
  });

  it("falha com chaves do Clerk trocadas (secreta no lugar da pública)", () => {
    expect(() =>
      parseEnv({
        ...valid,
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "sk_test_fake",
      }),
    ).toThrow("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  });

  it("falha se a URL de login não for a rota do app", () => {
    expect(() =>
      parseEnv({ ...valid, NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/login" }),
    ).toThrow("NEXT_PUBLIC_CLERK_SIGN_IN_URL");
  });
});
