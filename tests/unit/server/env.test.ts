import { describe, expect, it } from "vitest";

import { parseEnv } from "@/server/env";

const valid = { PRODUCT_SOURCE: "mock", LOG_LEVEL: "info" };

describe("parseEnv", () => {
  it("aceita um ambiente válido", () => {
    expect(parseEnv({ ...valid, PRODUCT_SOURCE: "prisma" })).toEqual({
      PRODUCT_SOURCE: "prisma",
      LOG_LEVEL: "info",
    });
  });

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
