import type { ProductDTO } from "@/types/api";

import { ComingSoonCard } from "./ComingSoonCard";

export function ComingSoonList({ products }: { products: ProductDTO[] }) {
  if (products.length === 0) {
    return (
      <p className="mt-[18px] text-center text-body text-ink-subtle">
        Nenhum lançamento previsto.
      </p>
    );
  }

  return (
    <ul className="mt-[18px] grid gap-3">
      {products.map((product) => (
        <li key={product.id}>
          <ComingSoonCard product={product} />
        </li>
      ))}
    </ul>
  );
}
