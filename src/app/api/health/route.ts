import { connection } from "next/server";

import { ok, withErrorHandling } from "@/server/http";
import { healthService } from "@/server/services/healthService";

/** Saúde do app para monitoramento: 200 com o banco respondendo, 503 sem ele. */
export const GET = withErrorHandling(async () => {
  await connection();

  const response = ok(await healthService.check());
  response.headers.set("cache-control", "no-store");
  return response;
});
