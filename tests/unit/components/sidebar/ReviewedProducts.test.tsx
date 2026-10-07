import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewedProducts } from "@/components/sidebar/ReviewedProducts";
import { buildReviewedProductDTO } from "../../../helpers/buildProductDTO";

describe("ReviewedProducts", () => {
  it("mostra o resumo da revisão e a nota de cada produto", () => {
    render(<ReviewedProducts products={[buildReviewedProductDTO()]} />);

    expect(screen.getByRole("link", { name: /Layer/ })).toBeTruthy();
    expect(
      screen.getByText("A forma mais simples de integrar ferramentas."),
    ).toBeTruthy();
    expect(screen.getByRole("img", { name: "Nota 5 de 5" })).toBeTruthy();
  });

  it("usa a descrição do produto quando a revisão não tem resumo", () => {
    render(
      <ReviewedProducts
        products={[
          buildReviewedProductDTO({ review: { rating: 4, summary: null } }),
        ]}
      />,
    );

    expect(
      screen.getByText("A API visual que conecta suas ferramentas favoritas."),
    ).toBeTruthy();
  });

  it("avisa quando ainda não há revisões", () => {
    render(<ReviewedProducts products={[]} />);

    expect(screen.getByText("Nenhum produto revisado ainda.")).toBeTruthy();
  });
});
