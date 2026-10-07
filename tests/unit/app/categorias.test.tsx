import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CategoriasPage from "@/app/categorias/page";

describe("/categorias", () => {
  it("lista os 5 topics", () => {
    render(<CategoriasPage />);

    const list = screen.getByRole("list", { name: "Categorias" });

    expect(
      within(list)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual([
      expect.stringContaining("Inteligência artificial"),
      expect.stringContaining("Marketing"),
      expect.stringContaining("Produtividade"),
      expect.stringContaining("SaaS"),
      expect.stringContaining("Tech"),
    ]);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Categorias",
    );
  });
});
