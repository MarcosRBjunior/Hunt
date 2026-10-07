import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "@/components/layout/SiteHeader";

describe("SiteHeader", () => {
  it("leva o logo para a home", () => {
    render(<SiteHeader />);

    expect(
      screen.getByRole("link", { name: "nova, página inicial" }),
    ).toHaveProperty("pathname", "/");
  });

  it("mostra a navegação principal", () => {
    render(<SiteHeader />);

    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    const links = within(nav).getAllByRole("link");

    expect(
      links.map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual([
      ["Produtos", "/produtos"],
      ["Categorias", "/categorias"],
      ["Sobre", "/sobre"],
    ]);
  });

  it("marca só a página atual com aria-current", () => {
    render(<SiteHeader active="categorias" />);

    expect(
      screen
        .getByRole("link", { name: "Categorias" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      screen
        .getByRole("link", { name: "Produtos" })
        .getAttribute("aria-current"),
    ).toBeNull();
  });

  it("leva Login e Registro para as páginas do Clerk", () => {
    render(<SiteHeader />);

    expect(
      screen.getByRole("link", { name: "Login" }).getAttribute("href"),
    ).toBe("/sign-in");
    expect(
      screen.getByRole("link", { name: /Registro/ }).getAttribute("href"),
    ).toBe("/sign-up");
  });
});
