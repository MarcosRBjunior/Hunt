import { plural } from "@/lib/utils";
import type { ProductDTO } from "@/types/api";

import { ProductLogo } from "./ProductLogo";
import { UpvoteButton } from "./UpvoteButton";

type ProductCardProps = {
  product: ProductDTO;
  rank: number;
};

export function ProductCard({ product, rank }: ProductCardProps) {
  return (
    <article className="group relative grid min-h-[104px] grid-cols-[58px_minmax(0,1fr)_48px] items-center gap-[11px] rounded-xl border border-transparent py-3.5 pr-3 pl-2 transition duration-[220ms] hover:z-[1] hover:-translate-y-0.5 hover:border-line-soft hover:bg-surface hover:shadow-card-hover sm:grid-cols-[28px_68px_minmax(0,1fr)_58px] sm:gap-4 sm:pr-4 sm:pl-3">
      <span className="text-caption font-extrabold tracking-[0.6px] text-ink-subtle max-sm:hidden">
        {String(rank).padStart(2, "0")}
      </span>

      <ProductLogo product={product} variant="card" />

      <div className="min-w-0">
        <h3 className="text-card-title font-extrabold tracking-[-0.3px] text-ink">
          {/* O link cobre o card inteiro; o botão de voto fica por cima (z-10). */}
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
        <p className="mt-1 mb-2 line-clamp-2 text-caption text-ink-subtle">
          {product.description}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <ul aria-label="Categorias" className="flex flex-wrap gap-1.5">
            {product.topics.map((topic) => (
              <li
                key={topic.slug}
                className="rounded-xs bg-surface-tag px-2 py-1 text-caption leading-none font-bold text-ink-muted"
              >
                {topic.name}
              </li>
            ))}
          </ul>
          <span className="text-caption text-ink-subtle">
            {plural(product.visits, "visita", "visitas")}
          </span>
        </div>
      </div>

      <UpvoteButton title={product.title} upvotes={product.upvotes} />
    </article>
  );
}
