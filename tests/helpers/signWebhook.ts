import { createHmac, randomUUID } from "node:crypto";

/**
 * Requisição de webhook como o Clerk (Svix) manda: corpo JSON e assinatura
 * HMAC-SHA256 de `id.timestamp.corpo` com o segredo `whsec_...`.
 */
export function signedWebhookRequest(
  event: unknown,
  {
    secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET!,
    timestamp = Math.floor(Date.now() / 1000),
  }: { secret?: string; timestamp?: number } = {},
): Request {
  const id = `msg_${randomUUID()}`;
  const body = JSON.stringify(event);
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signature = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");

  return new Request("https://hunt.example.com/api/webhooks/clerk", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "svix-id": id,
      "svix-timestamp": String(timestamp),
      "svix-signature": `v1,${signature}`,
    },
    body,
  });
}

/** Evento `user.deleted` do Clerk. */
export function userDeletedEvent(externalId: string) {
  return {
    type: "user.deleted",
    object: "event",
    data: { object: "user", id: externalId, deleted: true },
    timestamp: Date.now(),
    instance_id: "ins_test",
  };
}
