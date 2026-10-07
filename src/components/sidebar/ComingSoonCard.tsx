import { ProductLogo } from "@/components/products/ProductLogo";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { ProductDTO } from "@/types/api";

export function ComingSoonCard({ product }: { product: ProductDTO }) {
  return (
    <article className="relative rounded-xl border border-primary-border-soft bg-linear-135 from-primary-wash to-primary-wash-end p-[18px]">
      <div className="flex items-center gap-3">
        <ProductLogo product={product} variant="coming" />
        <div className="min-w-0">
          <Eyebrow className="mb-0.5 text-primary-hover">
            Lançamento em breve
          </Eyebrow>
          <h3 className="text-card-title font-extrabold tracking-[-0.3px] text-ink">
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="after:absolute after:inset-0 after:rounded-xl"
            >
              {product.title}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </h3>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-caption leading-relaxed text-ink-subtle">
        {product.description}
      </p>
    </article>
  );
}
