import { ProductItems } from "./ProductItems";

/**
 * O resto da lista, num pedaço do HTML depois dos primeiros cards. Esperar um
 * ciclo do event loop basta para o React mandar antes o que já está pronto.
 * Com 1.000 produtos no preview da Vercel, o LCP da home no desktop caiu de
 * 2,9 s para 1,3 s (docs/PERFORMANCE.md).
 */
export async function DeferredProductItems(
  props: Parameters<typeof ProductItems>[0],
) {
  await new Promise((resolve) => setTimeout(resolve, 0));
  return <ProductItems {...props} />;
}
