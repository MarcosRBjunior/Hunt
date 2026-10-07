import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Rating } from "@/components/sidebar/Rating";

describe("Rating", () => {
  it("anuncia a nota e mostra x/5", () => {
    render(<Rating value={4} />);

    const rating = screen.getByRole("img", { name: "Nota 4 de 5" });
    expect(rating.textContent).toContain("4.0");
    expect(rating.textContent).toContain("/ 5");
  });
});
