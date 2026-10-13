import { requireAdmin } from "@/server/auth";
import { ok, readJson, withErrorHandling } from "@/server/http";
import { adminProductService } from "@/server/services/adminProductService";

type Context = RouteContext<"/api/v1/admin/products/[id]/review">;

/** Cria ou substitui a revisão do produto (regra 9). Só admin. */
export const PUT = withErrorHandling(async (request, { params }: Context) => {
  await requireAdmin();

  const { id } = await params;
  return ok(await adminProductService.saveReview(id, await readJson(request)));
});
