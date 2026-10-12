import { connection } from "next/server";

import { ok, withErrorHandling } from "@/server/http";
import { productService } from "@/server/services/productService";

/** "Em breve": produtos `UPCOMING`, do mais recente para o mais antigo (regra 5). */
export const GET = withErrorHandling(async () => {
  await connection();

  return ok(await productService.listUpcoming());
});
