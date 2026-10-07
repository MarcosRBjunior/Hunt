import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "@/components/layout/SiteFooter";

describe("SiteFooter", () => {
  it("dá o crédito do Projeto 06", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("contentinfo").textContent).toContain("Projeto 06");
  });

  it.each([
    ["GitHub", "https://github.com/MarcosRBjunior"],
    ["LinkedIn", "https://www.linkedin.com/in/marcos-ribeirojr"],
  ])("abre o %s em nova aba com segurança", (name, href) => {
    render(<SiteFooter />);

    const link = screen.getByRole("link", { name: new RegExp(name) });
    expect(link.getAttribute("href")).toBe(href);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
