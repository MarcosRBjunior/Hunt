import { cleanup } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, vi } from "vitest";

import { GuestButtons } from "@/components/layout/GuestButtons";

import { mockRouter } from "../helpers/mockRouter";

// O AuthButtons lê a sessão do Clerk no servidor. Nos testes de componente
// o header sempre aparece no estado de visitante (Login/Registro).
vi.mock("@/components/layout/AuthButtons", () => ({
  AuthButtons: () => createElement(GuestButtons),
}));

// Sem App Router no jsdom: o useRouter devolve o mockRouter.
vi.mock("next/navigation", async (importOriginal) => {
  const { mockRouter } = await import("../helpers/mockRouter");
  return {
    ...(await importOriginal<typeof import("next/navigation")>()),
    useRouter: () => mockRouter,
  };
});

// O jsdom ainda não implementa os métodos do <dialog>.
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute("open");
};

afterEach(() => {
  cleanup();
  for (const method of Object.values(mockRouter)) method.mockClear();
});
