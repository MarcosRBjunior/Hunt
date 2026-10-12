import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminProductTable } from "@/components/admin/AdminProductTable";

import { buildProductDTO } from "../../../helpers/buildProductDTO";

describe("AdminProductTable", () => {
  it("mostra nome, status, votos, visitas, topics e data de cada produto", () => {
    render(
      <AdminProductTable
        products={[
          buildProductDTO({
            title: "Zwelie",
            status: "UPCOMING",
            upvotes: 0,
            visits: 0,
            topics: [],
            createdAt: "2026-10-11T02:30:00.000Z",
          }),
          buildProductDTO({ id: "2", upvotes: 1240 }),
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
    expect(cells(rows[0]!).slice(0, 5)).toEqual([
      "Em breve",
      "0",
      "0",
      "—",
      "10/10/2026",
    ]);
    expect(cells(rows[1]!).slice(0, 4)).toEqual([
      "Lançado",
      "1.240",
      "1.240",
      "Tech, SaaS",
    ]);
  });

  it("liga o botão Editar à página de edição do produto", () => {
    render(<AdminProductTable products={[buildProductDTO()]} />);

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
