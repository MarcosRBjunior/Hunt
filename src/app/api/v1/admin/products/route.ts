import { connection } from "next/server";

import { requireAdmin } from "@/server/auth";
import { ok, readJson, withErrorHandling } from "@/server/http";
import { adminProductService } from "@/server/services/adminProductService";

// O papel é conferido aqui, em cada handler (CLAUDE.md › Segurança).

export const GET = withErrorHandling(async () => {
  await connection();
  await requireAdmin();

  return ok(await adminProductService.list());
});

export const POST = withErrorHandling(async (request) => {
  await requireAdmin();

  return ok(await adminProductService.create(await readJson(request)), 201);
});
