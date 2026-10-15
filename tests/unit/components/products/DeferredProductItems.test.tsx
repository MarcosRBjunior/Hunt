import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeferredProductItems } from "@/components/products/DeferredProductItems";
import { buildProductDTO } from "../../../helpers/buildProductDTO";

describe("DeferredProductItems", () => {
  it("continua a numeração a partir de firstRank", async () => {
    // Server Component assíncrono: resolve antes de montar.
    render(
      <ol aria-label="Produtos">
        {await DeferredProductItems({
          products: [
            buildProductDTO({ id: "11", title: "Aurora Notes" }),
            buildProductDTO({ id: "12", title: "Brisa Notes" }),
          ],
          firstRank: 11,
          signedIn: false,
        })}
      </ol>,
    );

    const items = [...screen.getByRole("list", { name: "Produtos" }).children];
    expect(items.map((item) => item.querySelector("h3")?.textContent)).toEqual([
      expect.stringMatching(/^Aurora Notes/),
      expect.stringMatching(/^Brisa Notes/),
    ]);
    expect(items[0]?.textContent).toContain("11");
    expect(items[1]?.textContent).toContain("12");
  });
});
