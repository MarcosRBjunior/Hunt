import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AcessoNegadoPage from "@/app/acesso-negado/page";

describe("/acesso-negado", () => {
  it("explica o bloqueio e leva de volta para a home", () => {
    render(<AcessoNegadoPage />);

    expect(screen.getByText("Acesso negado")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Voltar para a home" })
        .getAttribute("href"),
    ).toBe("/");
  });
});
