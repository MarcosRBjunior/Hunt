import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CategoryList } from "@/components/topics/CategoryList";

describe("CategoryList", () => {
  it("lista os topics com a contagem, cada um levando ao filtro da home", () => {
    render(
      <CategoryList
        topics={[
          { slug: "ia", name: "Inteligência artificial", productCount: 1 },
          { slug: "marketing", name: "Marketing", productCount: 0 },
          { slug: "saas", name: "SaaS", productCount: 3 },
        ]}
      />,
    );

    const list = screen.getByRole("list", { name: "Categorias" });
    const links = within(list).getAllByRole("link");

    expect(
      links.map((link) => [link.getAttribute("href"), link.textContent]),
    ).toEqual([
      ["/?topic=ia", "Inteligência artificial1 produto#ia"],
      ["/?topic=marketing", "Marketing0 produtos#marketing"],
      ["/?topic=saas", "SaaS3 produtos#saas"],
    ]);
  });

  it("mostra o estado vazio sem topics", () => {
    render(<CategoryList topics={[]} />);

    expect(screen.queryByRole("list", { name: "Categorias" })).toBeNull();
    expect(screen.getByText("Nenhuma categoria por enquanto")).toBeTruthy();
  });
});
