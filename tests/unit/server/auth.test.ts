import { describe, expect, it, vi } from "vitest";

import { createAuth } from "@/server/auth";
import { ForbiddenError, UnauthenticatedError } from "@/server/errors";

type Claims = Record<string, unknown> | null;

function authWith(userId: string | null, sessionClaims: Claims = {}) {
  const ensureUser = vi.fn(async (externalId: string) => ({
    id: "11111111-1111-4111-8111-111111111111",
    externalId,
  }));
  const auth = createAuth({
    readSession: async () => ({
      userId,
      sessionClaims: sessionClaims as CustomJwtSessionClaims | null,
    }),
    userService: { ensureUser },
  });

  return { ...auth, ensureUser };
}

const admin = { metadata: { role: "admin" } };

describe("getViewer", () => {
  it("devolve null para visitante sem sessão", async () => {
    expect(await authWith(null).getViewer()).toBeNull();
  });

  it("identifica o usuário comum, sem papel de admin", async () => {
    expect(await authWith("user_1").getViewer()).toEqual({
      externalId: "user_1",
      isAdmin: false,
    });
  });

  it("reconhece o admin pelo publicMetadata exposto no token", async () => {
    expect(await authWith("user_1", admin).getViewer()).toEqual({
      externalId: "user_1",
      isAdmin: true,
    });
  });

  it.each([
    ["papel em unsafeMetadata", { unsafe_metadata: { role: "admin" } }],
    ["papel no topo do token", { role: "admin" }],
    ["papel com outra grafia", { metadata: { role: "Admin" } }],
    ["outro papel", { metadata: { role: "moderator" } }],
    ["token sem claims", null],
  ])("não dá admin com %s", async (_, claims) => {
    expect((await authWith("user_1", claims).getViewer())?.isAdmin).toBe(false);
  });

  it("não toca no banco", async () => {
    const auth = authWith("user_1", admin);

    await auth.getViewer();

    expect(auth.ensureUser).not.toHaveBeenCalled();
  });
});

describe("requireUser", () => {
  it("responde 401 para visitante, sem criar usuário", async () => {
    const auth = authWith(null);

    const error = await auth.requireUser().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(UnauthenticatedError);
    expect(error).toHaveProperty("status", 401);
    expect(auth.ensureUser).not.toHaveBeenCalled();
  });

  it("garante o usuário local e devolve o id interno", async () => {
    const auth = authWith("user_1");

    const user = await auth.requireUser();

    expect(auth.ensureUser).toHaveBeenCalledWith("user_1");
    expect(user).toEqual({
      externalId: "user_1",
      isAdmin: false,
      userId: "11111111-1111-4111-8111-111111111111",
    });
  });
});

describe("requireAdmin", () => {
  it("responde 401 para visitante", async () => {
    await expect(authWith(null).requireAdmin()).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it("responde 403 para usuário comum, sem gravar nada", async () => {
    const auth = authWith("user_1");

    const error = await auth.requireAdmin().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ForbiddenError);
    expect(error).toHaveProperty("status", 403);
    expect(auth.ensureUser).not.toHaveBeenCalled();
  });

  it("libera o admin", async () => {
    expect(await authWith("user_1", admin).requireAdmin()).toEqual({
      externalId: "user_1",
      isAdmin: true,
    });
  });
});
