import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Session = { signedIn: boolean; claims: CustomJwtSessionClaims | null };

const session = vi.hoisted((): Session => ({ signedIn: false, claims: null }));

// O Clerk lê a sessão; aqui segue a sessão de cada teste.
vi.mock("@clerk/nextjs", () => ({
  Show: ({ when, children }: { when: string; children: ReactNode }) =>
    (when === "signed-in") === session.signedIn ? children : null,
  UserButton: () => <div>Menu do usuário</div>,
  useAuth: () => ({ sessionClaims: session.claims }),
}));

// O setup dos testes de componente troca o AuthButtons; aqui vale o de verdade.
const { AuthButtons } = await vi.importActual<
  typeof import("@/components/layout/AuthButtons")
>("@/components/layout/AuthButtons");

function renderButtons(signedIn: boolean, claims: Session["claims"] = {}) {
  session.signedIn = signedIn;
  session.claims = signedIn ? claims : null;
  render(<AuthButtons />);
}

beforeEach(() => {
  session.signedIn = false;
  session.claims = null;
});

describe("AuthButtons", () => {
  it("visitante vê Login e Registro", () => {
    renderButtons(false);

    expect(screen.getByRole("link", { name: "Login" })).toBeTruthy();
    expect(screen.queryByText("Menu do usuário")).toBeNull();
    expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();
  });

  it("usuário comum vê o menu, sem o link Admin", () => {
    renderButtons(true, { metadata: {} });

    expect(screen.getByText("Menu do usuário")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();
  });

  it("admin vê o link para a área admin", () => {
    renderButtons(true, { metadata: { role: "admin" } });

    expect(
      screen.getByRole("link", { name: "Admin" }).getAttribute("href"),
    ).toBe("/admin/produtos");
    expect(screen.getByText("Menu do usuário")).toBeTruthy();
  });
});
