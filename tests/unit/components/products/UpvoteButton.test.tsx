import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UpvoteButton } from "@/components/products/UpvoteButton";

import { mockRouter } from "../../../helpers/mockRouter";

const productId = "aea24f42-490d-46d3-8400-9bcd5fe1565d";
const voteUrl = `/api/v1/products/${productId}/vote`;

type Props = Partial<Parameters<typeof UpvoteButton>[0]>;

function renderButton(props: Props = {}) {
  const all = {
    productId,
    title: "Layer",
    upvotes: 202,
    viewerHasVoted: false,
    signedIn: true,
    ...props,
  };
  const view = render(<UpvoteButton {...all} />);
  return {
    ...view,
    rerenderWith: (next: Props) =>
      view.rerender(<UpvoteButton {...all} {...next} />),
  };
}

function button() {
  return screen.getByRole("button", { name: /^Votar em Layer/ });
}

/** Resposta da API controlada pelo teste, para ver o estado otimista. */
function deferredFetch() {
  let respond: (status: number, body: unknown) => void = () => {};
  const fetch = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        respond = (status, body) => resolve(Response.json(body, { status }));
      }),
  );
  vi.stubGlobal("fetch", fetch);
  return {
    fetch,
    respond: (status: number, body: unknown) =>
      act(async () => respond(status, body)),
  };
}

function apiError(code: string, message = "Erro.") {
  return { error: { code, message, details: {} } };
}

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("UpvoteButton", () => {
  it("visitante vai para o login e volta para a página onde estava", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    window.history.replaceState(null, "", "/produtos");
    renderButton({ signedIn: false });

    fireEvent.click(button());

    expect(mockRouter.push).toHaveBeenCalledWith(
      "/sign-in?redirect_url=%2Fprodutos",
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(button().getAttribute("aria-pressed")).toBeNull();
  });

  it("vota de forma otimista e fica com o total devolvido pela API", async () => {
    const api = deferredFetch();
    renderButton();

    fireEvent.click(button());

    // Antes da resposta: +1 e botão ativo.
    expect(button().textContent).toBe("203");
    expect(button().getAttribute("aria-pressed")).toBe("true");
    expect(button().getAttribute("aria-label")).toBe(
      "Votar em Layer (203 votos)",
    );
    expect(api.fetch).toHaveBeenCalledWith(voteUrl, {
      method: "POST",
      headers: undefined,
      body: undefined,
    });

    await api.respond(201, {
      data: { productId, upvotes: 210, viewerHasVoted: true },
    });

    expect(button().textContent).toBe("210");
    expect(button().getAttribute("aria-pressed")).toBe("true");
  });

  it("TC-26: clicar de novo remove o voto e o contador volta", async () => {
    const api = deferredFetch();
    renderButton({ upvotes: 203, viewerHasVoted: true });

    fireEvent.click(button());

    expect(button().textContent).toBe("202");
    expect(button().getAttribute("aria-pressed")).toBe("false");
    expect(api.fetch).toHaveBeenCalledWith(
      voteUrl,
      expect.objectContaining({ method: "DELETE" }),
    );

    await api.respond(200, {
      data: { productId, upvotes: 202, viewerHasVoted: false },
    });
    expect(button().textContent).toBe("202");
  });

  it("ignora cliques enquanto o voto anterior não termina", async () => {
    const api = deferredFetch();
    renderButton();

    fireEvent.click(button());
    fireEvent.click(button());

    expect(api.fetch).toHaveBeenCalledTimes(1);
    expect(button().getAttribute("aria-busy")).toBe("true");
    await api.respond(201, {
      data: { productId, upvotes: 203, viewerHasVoted: true },
    });
    expect(button().getAttribute("aria-busy")).toBeNull();
  });

  it("desfaz o voto e avisa quando a API falha; o aviso some sozinho", async () => {
    const api = deferredFetch();
    renderButton();

    fireEvent.click(button());
    vi.useFakeTimers();
    await api.respond(500, apiError("INTERNAL_ERROR"));

    expect(button().textContent).toBe("202");
    expect(button().getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("status").textContent).toBe(
      "Não foi possível votar. Tente de novo.",
    );

    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("avisa com outra mensagem quando falha ao remover o voto", async () => {
    const api = deferredFetch();
    renderButton({ upvotes: 203, viewerHasVoted: true });

    fireEvent.click(button());
    await api.respond(422, apiError("PRODUCT_NOT_VOTABLE"));

    expect(button().textContent).toBe("203");
    expect(screen.getByRole("status").textContent).toBe(
      "Não foi possível remover o voto. Tente de novo.",
    );
  });

  it("sessão expirada (401): desfaz e manda para o login", async () => {
    const api = deferredFetch();
    renderButton();

    fireEvent.click(button());
    await api.respond(401, apiError("UNAUTHENTICATED"));

    expect(button().textContent).toBe("202");
    expect(mockRouter.push).toHaveBeenCalledWith("/sign-in?redirect_url=%2F");
  });

  it.each([
    ["ALREADY_VOTED", 409, false],
    ["VOTE_NOT_FOUND", 404, true],
  ])(
    "%s: o voto já estava no estado pedido, então busca os dados reais",
    async (code, status, viewerHasVoted) => {
      const api = deferredFetch();
      renderButton({ viewerHasVoted });

      fireEvent.click(button());
      await api.respond(status, apiError(code));

      expect(mockRouter.refresh).toHaveBeenCalled();
      expect(screen.getByRole("status").textContent).toBe("");
    },
  );

  it("dados novos do servidor substituem o estado local", async () => {
    const api = deferredFetch();
    const view = renderButton();

    fireEvent.click(button());
    await api.respond(201, {
      data: { productId, upvotes: 203, viewerHasVoted: true },
    });
    view.rerenderWith({ upvotes: 250, viewerHasVoted: false });

    expect(button().textContent).toBe("250");
    expect(button().getAttribute("aria-pressed")).toBe("false");
  });
});
