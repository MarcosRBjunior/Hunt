import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductForm } from "@/components/admin/ProductForm";

import { buildProductDTO } from "../../../helpers/buildProductDTO";
import { mockRouter } from "../../../helpers/mockRouter";

function field(label: string | RegExp) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function type(label: string | RegExp, value: string) {
  fireEvent.change(field(label), { target: { value } });
}

function fillValid() {
  type("Nome", "Layer");
  type("Descrição", "A API visual que conecta suas ferramentas.");
  type("Endereço do site", " https://layer.example.com ");
}

function submit(name = "Cadastrar produto") {
  return act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
}

function respondWith(status: number, body: unknown) {
  const fetch = vi.fn<typeof globalThis.fetch>(async () =>
    Response.json(body, { status }),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function sentBody(fetch: ReturnType<typeof respondWith>) {
  const init = fetch.mock.calls[0]?.[1] as RequestInit | undefined;
  return JSON.parse(String(init?.body));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("ProductForm", () => {
  it("conta os caracteres de nome e descrição e marca quando passa do limite", () => {
    render(<ProductForm />);

    type("Nome", "Layer");
    expect(screen.getByText("5/80")).toBeTruthy();

    type("Descrição", "x".repeat(501));
    const counter = screen.getByText("501/500");
    expect(counter.className).toContain("text-danger");
    expect(field("Descrição").getAttribute("aria-describedby")).toContain(
      counter.id,
    );
  });

  it("cadastra pela API, sem upvotes nem visits, e volta para a lista", async () => {
    const fetch = respondWith(201, { data: buildProductDTO() });
    render(<ProductForm />);

    fillValid();
    await submit();

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/admin/products",
      expect.objectContaining({ method: "POST" }),
    );
    expect(sentBody(fetch)).toEqual({
      title: "Layer",
      description: "A API visual que conecta suas ferramentas.",
      url: "https://layer.example.com",
      logoUrl: null,
    });
    expect(mockRouter.push).toHaveBeenCalledWith("/admin/produtos");
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it("TC-12 na tela: url javascript: é recusada antes de chamar a API", async () => {
    const fetch = respondWith(201, { data: {} });
    render(<ProductForm />);

    fillValid();
    type("Endereço do site", "javascript:alert(1)");
    await submit();

    expect(fetch).not.toHaveBeenCalled();
    expect(field("Endereço do site").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText(/comece com http:\/\/ ou https:\/\//)).toBeTruthy();
    expect(document.activeElement).toBe(field("Endereço do site"));
  });

  it("mostra todos os campos obrigatórios e foca o primeiro", async () => {
    render(<ProductForm />);

    await submit();

    expect(screen.getByText("Informe o nome.")).toBeTruthy();
    expect(screen.getByText("Informe a descrição.")).toBeTruthy();
    expect(document.activeElement).toBe(field("Nome"));
  });

  it("o erro some quando o campo é editado", async () => {
    render(<ProductForm />);

    await submit();
    type("Nome", "L");

    expect(screen.queryByText("Informe o nome.")).toBeNull();
    expect(field("Nome").getAttribute("aria-invalid")).toBeNull();
  });

  it("mostra no campo certo os erros de validação da API", async () => {
    respondWith(400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        details: { fields: { logoUrl: ["Logo recusado pelo servidor."] } },
      },
    });
    render(<ProductForm />);

    fillValid();
    await submit();

    expect(screen.getByText("Logo recusado pelo servidor.")).toBeTruthy();
    expect(document.activeElement).toBe(field(/Endereço do logo/));
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("mostra outros erros da API no topo e libera o botão", async () => {
    respondWith(403, {
      error: { code: "FORBIDDEN", message: "Acesso negado.", details: {} },
    });
    render(<ProductForm />);

    fillValid();
    await submit();

    expect(screen.getByRole("alert").textContent).toBe("Acesso negado.");
    expect(
      (
        screen.getByRole("button", {
          name: "Cadastrar produto",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });

  it("na edição, começa preenchido e salva com PATCH só os campos do formulário", async () => {
    const product = buildProductDTO({
      logoUrl: "https://example.com/logo.png",
      status: "UPCOMING",
    });
    const fetch = respondWith(200, { data: product });
    render(<ProductForm product={product} />);

    expect(field("Nome").value).toBe("Layer");
    type("Endereço do logo (opcional)", "");
    await submit("Salvar alterações");

    expect(fetch).toHaveBeenCalledWith(
      `/api/v1/admin/products/${product.id}`,
      expect.objectContaining({ method: "PATCH" }),
    );
    // Status e topics não vão no body: ficam como estão.
    expect(sentBody(fetch)).toEqual({
      title: "Layer",
      description: product.description,
      url: product.url,
      logoUrl: null,
    });
  });

  it("mostra a prévia do logo depois de uma pausa na digitação", () => {
    vi.useFakeTimers();
    render(<ProductForm />);

    type("Endereço do logo (opcional)", "https://example.com/logo.png");
    expect(screen.queryByRole("img", { name: "Prévia do logo" })).toBeNull();

    act(() => vi.advanceTimersByTime(400));
    const preview = screen.getByRole("img", { name: "Prévia do logo" });
    expect(preview.getAttribute("src")).toBe("https://example.com/logo.png");

    fireEvent.error(preview);
    expect(screen.getByText("Não foi possível carregar a imagem")).toBeTruthy();
  });

  it("não tenta carregar a prévia de um endereço inválido", () => {
    vi.useFakeTimers();
    render(<ProductForm />);

    type("Endereço do logo (opcional)", "javascript:alert(1)");
    act(() => vi.advanceTimersByTime(400));

    expect(screen.queryByRole("img", { name: "Prévia do logo" })).toBeNull();
  });
});
