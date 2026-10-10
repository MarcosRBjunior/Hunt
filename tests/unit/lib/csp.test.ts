import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, clerkFrontendApi } from "@/lib/csp";

const publishableKey = `pk_test_${btoa("hunt-123.clerk.accounts.dev$")}`;

function directives(policy: string): Record<string, string[]> {
  return Object.fromEntries(
    policy.split("; ").map((directive) => {
      const [name = "", ...sources] = directive.split(" ");
      return [name, sources];
    }),
  );
}

describe("clerkFrontendApi", () => {
  it("tira o domínio da instância da chave pública", () => {
    expect(clerkFrontendApi(publishableKey)).toBe(
      "hunt-123.clerk.accounts.dev",
    );
  });

  it("recusa chave que não é do Clerk", () => {
    expect(() => clerkFrontendApi(`pk_test_${btoa("sem-cifrao")}`)).toThrow(
      "Clerk",
    );
  });
});

describe("buildContentSecurityPolicy", () => {
  const production = directives(
    buildContentSecurityPolicy({ publishableKey, dev: false }),
  );

  it("só aceita scripts do próprio site, do Clerk (instância e Protect) e do Cloudflare", () => {
    expect(production["script-src"]).toEqual([
      "'self'",
      "'unsafe-inline'",
      "https://hunt-123.clerk.accounts.dev",
      "https://challenges.cloudflare.com",
      "https://*.protect.clerk.com",
    ]);
  });

  it("não libera scripts de qualquer origem nem eval em produção", () => {
    for (const wildcard of ["https:", "http:", "*", "'unsafe-eval'"]) {
      expect(production["script-src"]).not.toContain(wildcard);
    }
  });

  it("libera eval só em desenvolvimento (recarga do Next)", () => {
    const dev = directives(
      buildContentSecurityPolicy({ publishableKey, dev: true }),
    );

    expect(dev["script-src"]).toContain("'unsafe-eval'");
  });

  it("aceita logos https de qualquer domínio", () => {
    expect(production["img-src"]).toContain("https:");
  });

  it("bloqueia plugins, troca de base e o site dentro de iframe alheio", () => {
    expect(production["object-src"]).toEqual(["'none'"]);
    expect(production["base-uri"]).toEqual(["'self'"]);
    expect(production["frame-ancestors"]).toEqual(["'none'"]);
  });
});
