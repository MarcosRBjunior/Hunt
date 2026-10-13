import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminProductTable } from "@/components/admin/AdminProductTable";

import type { AdminProductDTO } from "@/types/api";

import { buildProductDTO } from "../../../helpers/buildProductDTO";

function adminProduct(
  overrides: Partial<AdminProductDTO> = {},
): AdminProductDTO {
  return { ...buildProductDTO(), review: null, ...overrides };
}

describe("AdminProductTable", () => {
  it("mostra nome, status, votos, visitas, topics e data de cada produto", () => {
    render(
      <AdminProductTable
        products={[
          adminProduct({
            title: "Zwelie",
            status: "UPCOMING",
            upvotes: 0,
            visits: 0,
            topics: [],
            createdAt: "2026-10-11T02:30:00.000Z",
          }),
          adminProduct({
            id: "2",
            upvotes: 1240,
            review: { rating: 4, summary: null },
          }),
        ]}
      />,
    );

    const rows = screen.getAllByRole("row").slice(1);
    const cells = (row: HTMLElement) =>
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent);

    expect(within(rows[0]!).getByRole("rowheader").textContent).toBe("Zwelie");
    // Data no fuso de Brasília (02:30 UTC ainda é dia 10).
    expect(cells(rows[0]!).slice(0, 6)).toEqual([
      "Em breve",
      "0",
      "0",
      "—",
      "—",
      "10/10/2026",
    ]);
    expect(cells(rows[1]!).slice(0, 4)).toEqual([
      "Lançado",
      "1.240",
      "1.240",
      "Tech, SaaS",
    ]);
    expect(within(rows[1]!).getByRole("img").getAttribute("aria-label")).toBe(
      "Nota 4 de 5",
    );
  });

  it("liga o botão Editar à página de edição do produto", () => {
    render(<AdminProductTable products={[adminProduct()]} />);

    expect(
      screen.getByRole("link", { name: "Editar Layer" }).getAttribute("href"),
    ).toBe("/admin/produtos/aea24f42-490d-46d3-8400-9bcd5fe1565d/editar");
    expect(screen.getByRole("button", { name: "Remover Layer" })).toBeTruthy();
  });

  it("sem produtos, mostra o estado vazio com o atalho para cadastrar", () => {
    render(<AdminProductTable products={[]} />);

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText("Nenhum produto cadastrado")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Cadastrar produto" })
        .getAttribute("href"),
    ).toBe("/admin/produtos/novo");
  });
});
