import { noContent, withErrorHandling } from "@/server/http";
import { productService } from "@/server/services/productService";

type Context = RouteContext<"/api/v1/products/[id]/visit">;

/**
 * Clique no link do produto (regra 6): público, sem deduplicar e sem corpo,
 * para funcionar com `navigator.sendBeacon`.
 */
export const POST = withErrorHandling(async (_request, { params }: Context) => {
  const { id } = await params;
  await productService.registerVisit(id);

  return noContent();
});
