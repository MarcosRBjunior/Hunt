import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ProductDTO, TopicDTO } from "@/types/api";

import { ProductCard } from "./ProductCard";

type ProductListProps = {
  products: ProductDTO[];
  /** Quem está vendo tem sessão (pode votar). */
  signedIn?: boolean;
  /** Topic do filtro `?topic=`, se houver (muda o estado vazio). */
  topic?: TopicDTO;
};

export function ProductList({
  products,
  signedIn = false,
  topic,
}: ProductListProps) {
  if (products.length === 0 && topic) {
    return (
      <div className="mt-[22px]">
        <EmptyState
          title={`Nenhum produto em ${topic.name} ainda`}
          description="Escolha outro topic ou limpe o filtro para ver todos os produtos."
          action={
            <ButtonLink href="/" variant="secondary" className="mt-2">
              Limpar filtro
            </ButtonLink>
          }
        />
      </div>
    );
  }

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
          <ProductCard product={product} rank={index + 1} signedIn={signedIn} />
        </li>
      ))}
    </ol>
  );
}
