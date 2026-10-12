import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/webhooks/clerk/route";
import type { UserRepository } from "@/server/repositories/userRepository";

import { signedWebhookRequest, userDeletedEvent } from "../helpers/signWebhook";

// Só o banco é simulado; handler, verificação da assinatura e serviço são reais.
const { repositories } = vi.hoisted(() => ({
  repositories: {
    productRepository: {},
    voteRepository: {},
    userRepository: {} as UserRepository,
  },
}));
vi.mock("@/server/repositories", () => repositories);

const deleteByExternalId = vi.fn<UserRepository["deleteByExternalId"]>();

beforeEach(() => {
  vi.clearAllMocks();
  deleteByExternalId.mockResolvedValue({ votesRemoved: 2 });
  Object.assign(repositories.userRepository, {
    upsertByExternalId: vi.fn(),
    deleteByExternalId,
  });
});

async function body(response: Response) {
  return response.json();
}

describe("POST /api/webhooks/clerk", () => {
  it("TC-27: user.deleted apaga o usuário e informa os votos descontados", async () => {
    const response = await POST(
      signedWebhookRequest(userDeletedEvent("user_2")),
      {},
    );

    expect(response.status).toBe(200);
    expect(await body(response)).toEqual({
      data: { removed: true, votesRemoved: 2 },
    });
    expect(deleteByExternalId).toHaveBeenCalledWith("user_2");
  });

  it("evento repetido (usuário já apagado) responde 200 sem mudar nada", async () => {
    deleteByExternalId.mockResolvedValue(null);

    const response = await POST(
      signedWebhookRequest(userDeletedEvent("user_2")),
      {},
    );

    expect(response.status).toBe(200);
    expect(await body(response)).toEqual({
      data: { removed: false, votesRemoved: 0 },
    });
  });

  it("não exige Origin: quem chama é o servidor do Clerk", async () => {
    const request = signedWebhookRequest(userDeletedEvent("user_2"));
    expect(request.headers.get("origin")).toBeNull();

    expect((await POST(request, {})).status).toBe(200);
  });

  it("ignora outros eventos", async () => {
    const response = await POST(
      signedWebhookRequest({
        type: "user.created",
        object: "event",
        data: { id: "user_3" },
      }),
      {},
    );

    expect(response.status).toBe(200);
    expect(await body(response)).toEqual({ data: { ignored: "user.created" } });
    expect(deleteByExternalId).not.toHaveBeenCalled();
  });

  it("TC-16: sem assinatura responde 400 e nada é gravado", async () => {
    const response = await POST(
      new Request("https://hunt.example.com/api/webhooks/clerk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(userDeletedEvent("user_2")),
      }),
      {},
    );

    expect(response.status).toBe(400);
    expect(await body(response)).toMatchObject({
      error: { code: "INVALID_WEBHOOK_SIGNATURE" },
    });
    expect(deleteByExternalId).not.toHaveBeenCalled();
  });

  it("assinatura com outro segredo responde 400", async () => {
    const response = await POST(
      signedWebhookRequest(userDeletedEvent("user_2"), {
        secret: `whsec_${Buffer.from("outro-segredo-qualquer-32-bytes!").toString("base64")}`,
      }),
      {},
    );

    expect(response.status).toBe(400);
    expect(deleteByExternalId).not.toHaveBeenCalled();
  });

  it("corpo alterado depois de assinado responde 400", async () => {
    const signed = signedWebhookRequest(userDeletedEvent("user_2"));
    const tampered = new Request(signed.url, {
      method: "POST",
      headers: signed.headers,
      body: JSON.stringify(userDeletedEvent("user_9")),
    });

    expect((await POST(tampered, {})).status).toBe(400);
    expect(deleteByExternalId).not.toHaveBeenCalled();
  });

  it("evento antigo (assinatura de mais de 5 minutos) responde 400", async () => {
    const response = await POST(
      signedWebhookRequest(userDeletedEvent("user_2"), {
        timestamp: Math.floor(Date.now() / 1000) - 10 * 60,
      }),
      {},
    );

    expect(response.status).toBe(400);
  });
});
