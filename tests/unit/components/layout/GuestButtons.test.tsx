import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GuestButtons } from "@/components/layout/GuestButtons";

describe("GuestButtons", () => {
  it("leva Login e Registro para as páginas do Clerk", () => {
    render(<GuestButtons />);

    expect(
      screen.getByRole("link", { name: "Login" }).getAttribute("href"),
    ).toBe("/sign-in");
    expect(
      screen.getByRole("link", { name: /Registro/ }).getAttribute("href"),
    ).toBe("/sign-up");
  });
});
