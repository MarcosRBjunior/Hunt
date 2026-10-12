import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductLink } from "@/components/products/ProductLink";
import { VisitCount, VisitCounter } from "@/components/products/VisitCount";

const productId = "aea24f42-490d-46d3-8400-9bcd5fe1565d";
const visitUrl = `/api/v1/products/${productId}/visit`;

function renderLink(visits = 1240) {
  return render(
    <VisitCounter visits={visits}>
      <ProductLink productId={productId} href="https://example.com/layer">
        Layer
      </ProductLink>
      <VisitCount />
    </VisitCounter>,
  );
}

function link() {
  return screen.getByRole("link", { name: "Layer" });
}

let sendBeacon: ReturnType<typeof vi.fn>;
let fetch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  sendBeacon = vi.fn(() => true);
  fetch = vi.fn(async () => new Response(null, { status: 204 }));
  vi.stubGlobal("navigator", { ...navigator, sendBeacon });
  vi.stubGlobal("fetch", fetch);
  // O jsdom não abre abas: o clique só dispara os handlers.
  document.addEventListener("click", preventNavigation);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.removeEventListener("click", preventNavigation);
});

/** Se algum handler do app cancelou o último clique (o link não abriria). */
let clickCanceledByApp = false;

function preventNavigation(event: Event) {
  // Roda depois dos handlers do React (o listener fica no document).
  clickCanceledByApp = event.defaultPrevented;
  event.preventDefault();
}

describe("ProductLink", () => {
  it("abre o site em nova aba com segurança", () => {
    renderLink();

    expect(link().getAttribute("href")).toBe("https://example.com/layer");
    expect(link().getAttribute("target")).toBe("_blank");
    expect(link().getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("TC-21: o clique manda o beacon de visita e soma 1 na tela", () => {
    renderLink();

    fireEvent.click(link());

    expect(sendBeacon).toHaveBeenCalledWith(visitUrl);
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByText("1.241 visitas")).toBeTruthy();
  });

  it("TC-22: cada clique conta, sem deduplicar", () => {
    renderLink(0);

    fireEvent.click(link());
    fireEvent.click(link());
    fireEvent.click(link());

    expect(sendBeacon).toHaveBeenCalledTimes(3);
    expect(screen.getByText("3 visitas")).toBeTruthy();
  });

  it("o clique com o botão do meio também conta", () => {
    renderLink(0);

    fireEvent(link(), new MouseEvent("auxclick", { bubbles: true, button: 1 }));
    fireEvent(link(), new MouseEvent("auxclick", { bubbles: true, button: 2 }));

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(screen.getByText("1 visita")).toBeTruthy();
  });

  it.each([
    ["recusa o envio", () => false],
    [
      "lança erro",
      () => {
        throw new Error("bloqueado");
      },
    ],
  ])("usa fetch com keepalive quando o sendBeacon %s", (_, beacon) => {
    sendBeacon.mockImplementation(beacon);
    renderLink();

    fireEvent.click(link());

    expect(fetch).toHaveBeenCalledWith(visitUrl, {
      method: "POST",
      keepalive: true,
    });
  });

  it("usa fetch com keepalive quando não há sendBeacon", () => {
    vi.stubGlobal("navigator", { ...navigator, sendBeacon: undefined });
    renderLink();

    fireEvent.click(link());

    expect(fetch).toHaveBeenCalledWith(visitUrl, {
      method: "POST",
      keepalive: true,
    });
  });

  it("o link funciona mesmo se o registro da visita falhar", () => {
    sendBeacon.mockReturnValue(false);
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    renderLink();

    fireEvent.click(link());

    expect(fetch).toHaveBeenCalled();
    expect(clickCanceledByApp).toBe(false);
    expect(screen.getByText("1.241 visitas")).toBeTruthy();
  });

  it("funciona fora de um VisitCounter (só registra a visita)", () => {
    render(
      <ProductLink productId={productId} href="https://example.com/layer">
        Layer
      </ProductLink>,
    );

    fireEvent.click(link());

    expect(sendBeacon).toHaveBeenCalledWith(visitUrl);
  });
});

describe("VisitCount", () => {
  it("dados novos do servidor substituem os cliques contados na tela", () => {
    const view = renderLink(10);
    fireEvent.click(link());
    expect(screen.getByText("11 visitas")).toBeTruthy();

    view.rerender(
      <VisitCounter visits={15}>
        <ProductLink productId={productId} href="https://example.com/layer">
          Layer
        </ProductLink>
        <VisitCount />
      </VisitCounter>,
    );

    expect(screen.getByText("15 visitas")).toBeTruthy();
  });

  it("não mostra nada fora de um VisitCounter", () => {
    const { container } = render(<VisitCount />);

    expect(container.textContent).toBe("");
  });
});
