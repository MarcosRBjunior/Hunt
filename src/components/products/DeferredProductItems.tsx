import { ProductItems } from "./ProductItems";

/**
 * O resto da lista, num pedaço do HTML depois dos primeiros cards. Esperar um
 * ciclo do event loop basta para o React mandar antes o que já está pronto: o
 * primeiro card (o LCP da home) não espera pelos outros 999 (docs/PERFORMANCE.md).
 */
export async function DeferredProductItems(
  props: Parameters<typeof ProductItems>[0],
) {
  await new Promise((resolve) => setTimeout(resolve, 0));
  return <ProductItems {...props} />;
}
