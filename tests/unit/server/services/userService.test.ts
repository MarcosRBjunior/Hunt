import { describe, expect, it, vi } from "vitest";

import { ValidationError } from "@/server/errors";
import { createUserService } from "@/server/services/userService";

function serviceWithRepository() {
  const upsertByExternalId = vi.fn(async (externalId: string) => ({
    id: "11111111-1111-4111-8111-111111111111",
    externalId,
  }));

  return {
    service: createUserService({ userRepository: { upsertByExternalId } }),
    upsertByExternalId,
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
