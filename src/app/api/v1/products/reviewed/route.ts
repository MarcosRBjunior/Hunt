import { connection } from "next/server";

import { ok, withErrorHandling } from "@/server/http";
import { productService } from "@/server/services/productService";

/** "Produtos revisados por nós" (regra 9). `?limit=` de 1 a 10, padrão 3. */
export const GET = withErrorHandling(async (request) => {
  await connection();

  const limit = new URL(request.url).searchParams.get("limit");
  return ok(await productService.listReviewed(limit));
});
