import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrendingTopicsBar } from "@/components/topics/TrendingTopicsBar";

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
});
