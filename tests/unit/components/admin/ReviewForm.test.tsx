import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReviewForm } from "@/components/admin/ReviewForm";

import { mockRouter } from "../../../helpers/mockRouter";

const productId = "aea24f42-490d-46d3-8400-9bcd5fe1565d";

function respondWith(status: number, body: unknown) {
  const fetch = vi.fn<typeof globalThis.fetch>(async () =>
    Response.json(body, { status }),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function sentBody(fetch: ReturnType<typeof respondWith>) {
  return JSON.parse(String(fetch.mock.calls[0]?.[1]?.body));
}

function save() {
  return act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Salvar revisão" }));
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ReviewForm", () => {
  it("sem revisão, começa sem nota e exige uma antes de chamar a API", async () => {
    const fetch = respondWith(200, { data: {} });
    render(<ReviewForm productId={productId} review={null} />);

    expect(screen.getByText("Sem nota")).toBeTruthy();
    await save();

    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByText("Escolha uma nota de 1 a 5.")).toBeTruthy();
  });

  it("salva a nota e o resumo com PUT e atualiza a página", async () => {
    const fetch = respondWith(200, { data: { rating: 4, summary: "Bom" } });
    render(<ReviewForm productId={productId} review={null} />);

    fireEvent.click(screen.getByLabelText("4 estrelas"));
    fireEvent.change(screen.getByLabelText("Resumo (opcional)"), {
      target: { value: "  Bom  " },
    });
    expect(screen.getByText("4/5")).toBeTruthy();
    await save();

    expect(fetch).toHaveBeenCalledWith(
      `/api/v1/admin/products/${productId}/review`,
      expect.objectContaining({ method: "PUT" }),
    );
    expect(sentBody(fetch)).toEqual({ rating: 4, summary: "Bom" });
    expect(screen.getByRole("status").textContent).toContain("Revisão salva.");
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it("começa com a revisão existente; resumo vazio vai como null", async () => {
    const fetch = respondWith(200, { data: { rating: 5, summary: null } });
    render(
      <ReviewForm
        productId={productId}
        review={{ rating: 5, summary: "Ótimo" }}
      />,
    );

    expect(
      (screen.getByLabelText("5 estrelas") as HTMLInputElement).checked,
    ).toBe(true);
    fireEvent.change(screen.getByLabelText("Resumo (opcional)"), {
      target: { value: "" },
    });
    await save();

    expect(sentBody(fetch)).toEqual({ rating: 5, summary: null });
  });

  it("conta os caracteres do resumo e recusa mais de 280", async () => {
    const fetch = respondWith(200, { data: {} });
    render(<ReviewForm productId={productId} review={null} />);

    fireEvent.click(screen.getByLabelText("3 estrelas"));
    fireEvent.change(screen.getByLabelText("Resumo (opcional)"), {
      target: { value: "x".repeat(281) },
    });
    expect(screen.getByText("281/280").className).toContain("text-danger");
    await save();

    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByText("Use no máximo 280 caracteres.")).toBeTruthy();
  });

  it("mostra o erro da API sem marcar como salva", async () => {
    respondWith(404, {
      error: {
        code: "PRODUCT_NOT_FOUND",
        message: "Produto não encontrado.",
        details: {},
      },
    });
    render(<ReviewForm productId={productId} review={null} />);

    fireEvent.click(screen.getByLabelText("1 estrela"));
    await save();

    expect(screen.getByRole("alert").textContent).toBe(
      "Produto não encontrado.",
    );
    expect(screen.getByRole("status").textContent).toBe("");
    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });
});
