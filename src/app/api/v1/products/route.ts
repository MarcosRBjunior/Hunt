import { connection } from "next/server";

import { getViewer } from "@/server/auth";
import { ok, withErrorHandling } from "@/server/http";
import { productService } from "@/server/services/productService";

export const GET = withErrorHandling(async (request) => {
  // Sempre em tempo de requisição: a lista muda com votos (sem cache no MVP).
  await connection();

  // `?topic=slug`: um topic por vez; repetido vira lista e o serviço recusa.
  const topic = new URL(request.url).searchParams.getAll("topic");

  // Login opcional: só preenche `viewerHasVoted`.
  const viewer = await getViewer();

  return ok(await productService.listLaunched(viewer, topic));
});
