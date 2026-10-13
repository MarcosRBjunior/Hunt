import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LaunchedProducts } from "@/components/products/LaunchedProducts";

// Fora do servidor do Next não existe escopo de requisição; o resto do módulo é real.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));

// Visitante. Os produtos vêm do mock real (PRODUCT_SOURCE=mock).
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: null, sessionClaims: null }),
}));

/** Server Component assíncrono: resolve antes de montar. */
async function renderWithQuery(query?: Record<string, string | string[]>) {
  render(
    await LaunchedProducts({
      searchParams: query ? Promise.resolve(query) : undefined,
    }),
  );
}

function productTitles() {
  return screen
    .getAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);
}

describe("LaunchedProducts", () => {
  it("sem filtro, mostra todos os lançados", async () => {
    await renderWithQuery();

    expect(productTitles()).toEqual([
      expect.stringMatching(/^Milo AI/),
      expect.stringMatching(/^Layer/),
      expect.stringMatching(/^Sunnie/),
      expect.stringMatching(/^Orbit/),
    ]);
  });

  it("TC-13 na tela: ?topic=saas mostra só os produtos SaaS, por votos", async () => {
    await renderWithQuery({ topic: "saas" });

    expect(productTitles()).toEqual([
      expect.stringMatching(/^Layer/),
      expect.stringMatching(/^Sunnie/),
      expect.stringMatching(/^Orbit/),
    ]);
  });

  it.each([
    ["inexistente", { topic: "inexistente" }],
    ["mal formado", { topic: "SaaS" }],
    ["repetido", { topic: ["saas", "tech"] }],
  ])(
    "TC-14 na tela: topic %s mostra o aviso na coluna, com link para limpar",
    async (_, query) => {
      await renderWithQuery(query);

      expect(screen.getByText("Categoria não encontrada")).toBeTruthy();
      expect(
        screen
          .getByRole("link", { name: "Limpar filtro" })
          .getAttribute("href"),
      ).toBe("/");
      expect(screen.queryByRole("list", { name: "Produtos" })).toBeNull();
    },
  );
});
