import type { ReviewedProductDTO } from "@/types/api";

import { ReviewedProductCard } from "./ReviewedProductCard";

export function ReviewedProducts({
  products,
}: {
  products: ReviewedProductDTO[];
}) {
  if (products.length === 0) {
    return (
      <p className="mt-6 text-body text-ink-subtle">
        Nenhum produto revisado ainda.
      </p>
    );
  }

  return (
    <ul className="mt-[22px] grid gap-2.5">
      {products.map((product) => (
        <li key={product.id}>
          <ReviewedProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
