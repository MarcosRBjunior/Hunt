import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCard } from "@/components/products/ProductCard";
import { buildProductDTO } from "../../../helpers/buildProductDTO";

describe("ProductCard", () => {
  it("abre o site do produto em nova aba com segurança", () => {
    render(<ProductCard product={buildProductDTO()} rank={2} />);

    const link = screen.getByRole("link", { name: /Layer/ });
    expect(link.getAttribute("href")).toBe("https://example.com/layer");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("mostra rank, descrição, topics e visitas formatadas", () => {
    render(<ProductCard product={buildProductDTO()} rank={2} />);

    const card = screen.getByRole("article");
    expect(card.textContent).toContain("02");
    expect(card.textContent).toContain(
      "A API visual que conecta suas ferramentas favoritas.",
    );
    expect(screen.getByText("Tech")).toBeTruthy();
    expect(screen.getByText("SaaS")).toBeTruthy();
    expect(screen.getByText("1.240 visitas")).toBeTruthy();
  });

  it("usa o singular com uma visita", () => {
    render(<ProductCard product={buildProductDTO({ visits: 1 })} rank={1} />);

    expect(screen.getByText("1 visita")).toBeTruthy();
  });

  it("mostra os votos no botão de voto", () => {
    render(<ProductCard product={buildProductDTO()} rank={2} />);

    expect(
      screen.getByRole("button", { name: "Votar em Layer (202 votos)" }),
    ).toBeTruthy();
  });

  it("usa o logo quando o produto tem logoUrl", () => {
    const { container } = render(
      <ProductCard
        product={buildProductDTO({ logoUrl: "https://example.com/logo.png" })}
        rank={1}
      />,
    );

    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://example.com/logo.png",
    );
  });

  it("sem logoUrl, desenha a arte do design system a partir do id", () => {
    const { container } = render(
      <ProductCard product={buildProductDTO()} rank={1} />,
    );

    const art = container.querySelector("[data-accent]");
    expect(container.querySelector("img")).toBeNull();
    expect(art?.getAttribute("data-accent")).toBe("blue");
    expect(art?.getAttribute("data-icon")).toBe("layer");
  });
});
