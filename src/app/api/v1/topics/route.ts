import { connection } from "next/server";

import { ok, withErrorHandling } from "@/server/http";
import { topicService } from "@/server/services/topicService";

/** Os 5 topics com `productCount` (só produtos lançados). */
export const GET = withErrorHandling(async () => {
  // A contagem muda quando o admin salva um produto: sem cache.
  await connection();

  return ok(await topicService.listWithProductCount());
});
