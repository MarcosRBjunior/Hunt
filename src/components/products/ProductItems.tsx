import type { ProductDTO } from "@/types/api";

import { ProductCard } from "./ProductCard";

type ProductItemsProps = {
  products: ProductDTO[];
  /** Posição do primeiro produto na lista inteira (a numeração continua). */
  firstRank: number;
  signedIn: boolean;
};

/** Os `<li>` de um trecho da lista de produtos. */
export function ProductItems({
  products,
  firstRank,
  signedIn,
}: ProductItemsProps) {
  return products.map((product, index) => (
    <li key={product.id}>
      <ProductCard
        product={product}
        rank={firstRank + index}
        signedIn={signedIn}
      />
    </li>
  ));
}
