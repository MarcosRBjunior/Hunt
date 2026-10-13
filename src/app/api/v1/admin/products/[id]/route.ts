import { requireAdmin } from "@/server/auth";
import { noContent, ok, readJson, withErrorHandling } from "@/server/http";
import { adminProductService } from "@/server/services/adminProductService";

type Context = RouteContext<"/api/v1/admin/products/[id]">;

// O papel é conferido aqui, em cada handler (CLAUDE.md › Segurança).

/** Edição parcial: só os campos enviados mudam. */
export const PATCH = withErrorHandling(async (request, { params }: Context) => {
  await requireAdmin();

  const { id } = await params;
  return ok(await adminProductService.update(id, await readJson(request)));
});

/** Remove o produto e, em cascata, votos, topics e revisão (regra 8). */
export const DELETE = withErrorHandling(
  async (_request, { params }: Context) => {
    await requireAdmin();

    const { id } = await params;
    await adminProductService.remove(id);

    return noContent();
  },
);
