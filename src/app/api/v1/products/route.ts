import { connection } from "next/server";

import { getViewer } from "@/server/auth";
import { ok, withErrorHandling } from "@/server/http";
import { productService } from "@/server/services/productService";

export const GET = withErrorHandling(async () => {
  // Sempre em tempo de requisição: a lista muda com votos (sem cache no MVP).
  await connection();

  // Login opcional: só preenche `viewerHasVoted`.
  const viewer = await getViewer();

  return ok(await productService.listLaunched(viewer));
});
