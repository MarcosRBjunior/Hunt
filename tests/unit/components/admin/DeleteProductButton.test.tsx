import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

import { mockRouter } from "../../../helpers/mockRouter";

const productId = "aea24f42-490d-46d3-8400-9bcd5fe1565d";

function renderButton() {
  render(<DeleteProductButton productId={productId} title="Layer" />);
  return {
    dialog: () => document.querySelector("dialog")!,
    open: () =>
      fireEvent.click(screen.getByRole("button", { name: "Remover Layer" })),
    confirm: () =>
      act(async () => {
        fireEvent.click(
          screen.getByRole("button", { name: "Remover", hidden: true }),
        );
      }),
  };
}

function respondWith(status: number, body?: unknown) {
  const fetch = vi.fn(async () =>
    body === undefined
      ? new Response(null, { status })
      : Response.json(body, { status }),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DeleteProductButton", () => {
  it("pede confirmação antes de remover", () => {
    const fetch = respondWith(204);
    const view = renderButton();

    expect(view.dialog().open).toBe(false);
    view.open();

    expect(view.dialog().open).toBe(true);
    expect(view.dialog().textContent).toContain("Remover Layer?");
    expect(view.dialog().textContent).toContain(
      "Os votos, os topics e a revisão deste produto também serão apagados.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("Cancelar fecha sem remover", () => {
    const fetch = respondWith(204);
    const view = renderButton();

    view.open();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(view.dialog().open).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("confirmado, remove pela API e atualiza a lista", async () => {
    const fetch = respondWith(204);
    const view = renderButton();

    view.open();
    await view.confirm();

    expect(fetch).toHaveBeenCalledWith(`/api/v1/admin/products/${productId}`, {
      method: "DELETE",
      headers: undefined,
      body: undefined,
    });
    expect(view.dialog().open).toBe(false);
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it("produto já removido em outro lugar: só atualiza a lista", async () => {
    respondWith(404, {
      error: {
        code: "PRODUCT_NOT_FOUND",
        message: "Produto não encontrado.",
        details: {},
      },
    });
    const view = renderButton();

    view.open();
    await view.confirm();

    expect(view.dialog().open).toBe(false);
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it("mostra o erro da API e mantém a confirmação aberta", async () => {
    respondWith(403, {
      error: { code: "FORBIDDEN", message: "Acesso negado.", details: {} },
    });
    const view = renderButton();

    view.open();
    await view.confirm();

    expect(view.dialog().open).toBe(true);
    expect(screen.getByRole("alert").textContent).toBe("Acesso negado.");
    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });
});
