import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrendingTopicsBar } from "@/components/topics/TrendingTopicsBar";

import { mockSearchParams } from "../../../helpers/mockRouter";

function chips() {
  const bar = screen.getByRole("region", { name: "Trending topics" });
  return within(bar).getAllByRole("link");
}

describe("TrendingTopicsBar", () => {
  it("mostra os 5 topics em ordem alfabética e o aviso de atualização", () => {
    render(<TrendingTopicsBar />);

    const bar = screen.getByRole("region", { name: "Trending topics" });
    expect(
      within(bar)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual([
      "Inteligência artificial",
      "Marketing",
      "Produtividade",
      "SaaS",
      "Tech",
    ]);
    expect(within(bar).getByText("Atualizado agora")).toBeTruthy();
  });

  it("sem filtro, cada chip leva para /?topic=slug e nenhum fica ativo", () => {
    render(<TrendingTopicsBar />);

    expect(chips().map((chip) => chip.getAttribute("href"))).toEqual([
      "/?topic=ia",
      "/?topic=marketing",
      "/?topic=produtividade",
      "/?topic=saas",
      "/?topic=tech",
    ]);
    expect(chips().some((chip) => chip.hasAttribute("aria-current"))).toBe(
      false,
    );
  });

  it("com ?topic=saas, o chip SaaS fica ativo e clicar nele tira o filtro", () => {
    mockSearchParams.current = new URLSearchParams("topic=saas");
    render(<TrendingTopicsBar />);

    const active = screen.getByRole("link", { name: "SaaS (remover filtro)" });
    expect(active.getAttribute("aria-current")).toBe("true");
    expect(active.getAttribute("href")).toBe("/");
    expect(chips().filter((chip) => chip.hasAttribute("aria-current"))).toEqual(
      [active],
    );
    // Os outros trocam o filtro: um topic por vez.
    expect(
      screen.getByRole("link", { name: "Tech" }).getAttribute("href"),
    ).toBe("/?topic=tech");
  });

  it("com um topic inexistente na URL, nenhum chip fica ativo", () => {
    mockSearchParams.current = new URLSearchParams("topic=inexistente");
    render(<TrendingTopicsBar />);

    expect(chips().some((chip) => chip.hasAttribute("aria-current"))).toBe(
      false,
    );
  });
});
