import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ErrorState } from "@/components/ui/ErrorState";

describe("ErrorState", () => {
  it("avisa do erro e chama onRetry em Tentar novamente", () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Não foi possível carregar" onRetry={onRetry} />);

    expect(screen.getByRole("alert").textContent).toContain(
      "Não foi possível carregar",
    );

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
