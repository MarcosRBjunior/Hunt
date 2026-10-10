import { cleanup } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, vi } from "vitest";

import { GuestButtons } from "@/components/layout/GuestButtons";

// O AuthButtons lê a sessão do Clerk no servidor. Nos testes de componente
// o header sempre aparece no estado de visitante (Login/Registro).
vi.mock("@/components/layout/AuthButtons", () => ({
  AuthButtons: () => createElement(GuestButtons),
}));

afterEach(() => {
  cleanup();
});
