import { EmptyState } from "@/components/ui/EmptyState";
import type { ProductDTO } from "@/types/api";

import { ProductCard } from "./ProductCard";

export function ProductList({ products }: { products: ProductDTO[] }) {
  if (products.length === 0) {
    return (
      <div className="mt-[22px]">
        <EmptyState
          title="Nenhum produto lançado ainda"
          description="Assim que a equipe publicar novidades, elas aparecem aqui."
        />
      </div>
    );
  }

  return (
    <ol aria-label="Produtos" className="mt-[22px] grid gap-2.5">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} rank={index + 1} />
        </li>
      ))}
    </ol>
  );
}
