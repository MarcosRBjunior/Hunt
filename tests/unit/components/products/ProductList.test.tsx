import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductList } from "@/components/products/ProductList";
import { buildProductDTO } from "../../../helpers/buildProductDTO";

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

  it("mostra o estado vazio quando não há produtos", () => {
    render(<ProductList products={[]} />);

    expect(screen.queryByRole("list", { name: "Produtos" })).toBeNull();
    expect(screen.getByText("Nenhum produto lançado ainda")).toBeTruthy();
  });
});
