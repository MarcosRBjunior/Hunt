import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComingSoonList } from "@/components/sidebar/ComingSoonList";
import { buildProductDTO } from "../../../helpers/buildProductDTO";

describe("ComingSoonList", () => {
  it("mostra o produto em breve com a descrição", () => {
    render(
      <ComingSoonList
        products={[
          buildProductDTO({
            title: "zwelie",
            status: "UPCOMING",
            description: "Integre projetos da sua plataforma cloud favorita.",
          }),
        ]}
      />,
    );

    expect(screen.getByText("Lançamento em breve")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /^zwelie/ })).toBeTruthy();
    expect(
      screen.getByText("Integre projetos da sua plataforma cloud favorita."),
    ).toBeTruthy();
    expect(screen.queryByText(/Quero ser avisado/)).toBeNull();
  });

  it("avisa quando não há lançamentos previstos", () => {
    render(<ComingSoonList products={[]} />);

    expect(screen.getByText("Nenhum lançamento previsto.")).toBeTruthy();
  });
});
