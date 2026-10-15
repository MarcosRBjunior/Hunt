import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductList } from "@/components/products/ProductList";
import { buildProductDTO } from "../../../helpers/buildProductDTO";

// O resto da lista é um Server Component assíncrono, que o jsdom não monta:
// aqui ele só mostra o que recebeu (o comportamento dele tem teste próprio).
vi.mock("@/components/products/DeferredProductItems", async () => {
  const { createElement } = await import("react");
  return {
    DeferredProductItems: (props: { products: unknown[]; firstRank: number }) =>
      createElement("li", {
        "data-testid": "resto",
        "data-first-rank": props.firstRank,
        "data-count": props.products.length,
      }),
  };
});

function buildProducts(count: number) {
  return Array.from({ length: count }, (_, index) =>
    buildProductDTO({ id: String(index + 1), title: `Produto ${index + 1}` }),
  );
}

describe("ProductList", () => {
  it("lista os produtos na ordem recebida, numerando a partir de 01", () => {
    render(
      <ProductList
        products={[
          buildProductDTO({ id: "1", title: "Milo AI" }),
          buildProductDTO({ id: "2", title: "Layer" }),
        ]}
      />,
    );

    const items = [...screen.getByRole("list", { name: "Produtos" }).children];
    expect(items.map((item) => item.querySelector("h3")?.textContent)).toEqual([
      expect.stringMatching(/^Milo AI/),
      expect.stringMatching(/^Layer/),
    ]);
    expect(items[0]?.textContent).toContain("01");
    expect(items[1]?.textContent).toContain("02");
  });

  it("com até 10 produtos, mostra todos de uma vez", () => {
    render(<ProductList products={buildProducts(10)} />);

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(10);
    expect(screen.queryByTestId("resto")).toBeNull();
  });

  it("com mais de 10, os 10 primeiros vêm direto e o resto depois, numerado a partir de 11", () => {
    render(<ProductList products={buildProducts(12)} />);

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(10);
    expect(headings.at(-1)?.textContent).toMatch(/^Produto 10/);

    const rest = screen.getByTestId("resto");
    expect(rest.dataset.firstRank).toBe("11");
    expect(rest.dataset.count).toBe("2");
    // Uma lista só: o resto entra no mesmo <ol>.
    expect(rest.parentElement).toBe(
      screen.getByRole("list", { name: "Produtos" }),
    );
  });

  it("mostra o estado vazio quando não há produtos", () => {
    render(<ProductList products={[]} />);

    expect(screen.queryByRole("list", { name: "Produtos" })).toBeNull();
    expect(screen.getByText("Nenhum produto lançado ainda")).toBeTruthy();
  });

  it("com filtro de topic e sem produtos, diz qual topic e oferece limpar o filtro", () => {
    render(
      <ProductList products={[]} topic={{ slug: "saas", name: "SaaS" }} />,
    );

    expect(screen.getByText("Nenhum produto em SaaS ainda")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Limpar filtro" }).getAttribute("href"),
    ).toBe("/");
  });
});
