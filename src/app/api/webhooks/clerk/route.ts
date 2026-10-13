import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

import { env } from "@/server/env";
import { ValidationError } from "@/server/errors";
import { ok, withErrorHandling } from "@/server/http";
import { userService } from "@/server/services/userService";

/**
 * Webhooks do Clerk. A assinatura é conferida antes de tudo (400 se faltar ou
 * não bater). Só `user.deleted` faz algo: apaga o usuário local e desconta os
 * votos dele (regra 11). Reenvios do mesmo evento não mudam nada.
 */
export const POST = withErrorHandling(
  async (request) => {
    let event;
    try {
      // O tipo pede NextRequest, mas a função aceita qualquer Request da Web
      // API (é o que o route handler recebe).
      event = await verifyWebhook(request as NextRequest, {
        signingSecret: env.CLERK_WEBHOOK_SIGNING_SECRET,
      });
    } catch {
      throw new ValidationError("Assinatura do webhook inválida.", {
        code: "INVALID_WEBHOOK_SIGNATURE",
      });
    }

    if (event.type === "user.deleted" && event.data.id) {
      return ok(await userService.removeDeletedUser(event.data.id));
    }

    // Outros eventos não interessam ao app.
    return ok({ ignored: event.type });
  },
  // Quem chama é o servidor do Clerk: não há Origin; vale a assinatura.
  { checkOrigin: false },
);
