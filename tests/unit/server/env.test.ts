import { describe, expect, it } from "vitest";

import { parseEnv } from "@/server/env";

const valid = { PRODUCT_SOURCE: "mock", LOG_LEVEL: "info" };
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

  it.each(["PRODUCT_SOURCE", "LOG_LEVEL"])(
    "falha quando %s está ausente",
    (name) => {
      const source: Record<string, string | undefined> = { ...valid };
      delete source[name];

      expect(() => parseEnv(source)).toThrow(name);
    },
  );

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
});
