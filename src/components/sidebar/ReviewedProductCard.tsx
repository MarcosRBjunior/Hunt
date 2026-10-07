import { ProductLogo } from "@/components/products/ProductLogo";
import type { ReviewedProductDTO } from "@/types/api";

import { Rating } from "./Rating";

export function ReviewedProductCard({
  product,
}: {
  product: ReviewedProductDTO;
}) {
  return (
    <article className="relative flex min-h-[112px] items-center justify-between gap-3 rounded-lg border border-line-soft bg-surface-subtle p-[18px] transition duration-200 hover:-translate-x-[3px] hover:bg-surface hover:shadow-panel-hover">
      <div className="min-w-0">
        <h3 className="text-card-title font-extrabold tracking-[-0.3px] text-ink">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="after:absolute after:inset-0 after:rounded-lg"
          >
            {product.title}
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        </h3>
        <p className="mt-1 mb-2.5 line-clamp-2 text-caption text-ink-subtle">
          {product.review.summary ?? product.description}
        </p>
        <Rating value={product.review.rating} />
      </div>
      <ProductLogo product={product} variant="review" />
    </article>
  );
}
