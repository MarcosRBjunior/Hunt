import { Suspense } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ProductDTO, TopicDTO } from "@/types/api";

import { DeferredProductItems } from "./DeferredProductItems";
import { ProductItems } from "./ProductItems";

/**
 * Cards que saem no primeiro pedaço do HTML. O resto vem logo depois, na mesma
 * resposta (não é paginação: a lista inteira chega sem clique nem rolagem), e
 * o primeiro card, que é o LCP da home, não espera pelos outros.
 */
const FIRST_CHUNK_SIZE = 10;

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

  const first = products.slice(0, FIRST_CHUNK_SIZE);
  const rest = products.slice(FIRST_CHUNK_SIZE);

  return (
    <ol aria-label="Produtos" className="mt-[22px] grid gap-2.5">
      <ProductItems products={first} firstRank={1} signedIn={signedIn} />
      {rest.length > 0 && (
        <Suspense>
          <DeferredProductItems
            products={rest}
            firstRank={FIRST_CHUNK_SIZE + 1}
            signedIn={signedIn}
          />
        </Suspense>
      )}
    </ol>
  );
}
