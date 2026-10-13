import { describe, expect, it, vi } from "vitest";

import { ValidationError } from "@/server/errors";
import { createUserService } from "@/server/services/userService";

function serviceWithRepository() {
  const upsertByExternalId = vi.fn(async (externalId: string) => ({
    id: "11111111-1111-4111-8111-111111111111",
    externalId,
  }));

  const deleteByExternalId = vi.fn(
    async (): Promise<{ votesRemoved: number } | null> => ({ votesRemoved: 2 }),
  );

  return {
    service: createUserService({
      userRepository: { upsertByExternalId, deleteByExternalId },
    }),
    upsertByExternalId,
    deleteByExternalId,
  };
}

describe("userService.ensureUser", () => {
  it("cria ou reaproveita o usuário pelo id do Clerk", async () => {
    const { service, upsertByExternalId } = serviceWithRepository();

    const user = await service.ensureUser("user_1");

    expect(upsertByExternalId).toHaveBeenCalledWith("user_1");
    expect(user.externalId).toBe("user_1");
  });

  it.each(["", "   "])("recusa id externo vazio (%j)", async (externalId) => {
    const { service, upsertByExternalId } = serviceWithRepository();

    await expect(service.ensureUser(externalId)).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(upsertByExternalId).not.toHaveBeenCalled();
  });
});

describe("userService.removeDeletedUser", () => {
  it("apaga o usuário local e conta os votos descontados", async () => {
    const { service, deleteByExternalId } = serviceWithRepository();

    expect(await service.removeDeletedUser("user_1")).toEqual({
      removed: true,
      votesRemoved: 2,
    });
    expect(deleteByExternalId).toHaveBeenCalledWith("user_1");
  });

  it("evento repetido (usuário já apagado) não muda nada", async () => {
    const { service, deleteByExternalId } = serviceWithRepository();
    deleteByExternalId.mockResolvedValueOnce(null);

    expect(await service.removeDeletedUser("user_1")).toEqual({
      removed: false,
      votesRemoved: 0,
    });
  });

  it("recusa id externo vazio", async () => {
    const { service, deleteByExternalId } = serviceWithRepository();

    await expect(service.removeDeletedUser(" ")).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(deleteByExternalId).not.toHaveBeenCalled();
  });
});
