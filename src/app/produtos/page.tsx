import type { Metadata } from "next";
import { Suspense } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { LaunchedProducts } from "@/components/products/LaunchedProducts";
import { ProductListSkeleton } from "@/components/products/ProductListSkeleton";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Produtos",
};

export default function ProdutosPage() {
  return (
    <PageShell active="produtos">
      <section aria-labelledby="produtos" className="pt-9 pb-8 md:px-2">
        <SectionHeading
          as="h1"
          id="produtos"
          eyebrow="Todos os lançamentos"
          title="Produtos"
        />
        <p className="mt-3 max-w-xl text-nav text-ink-subtle">
          A lista completa, ordenada pelos votos da comunidade. No empate, o
          lançamento mais recente vem primeiro.
        </p>
        <SectionErrorBoundary title="Não foi possível carregar os produtos">
          <Suspense fallback={<ProductListSkeleton />}>
            <LaunchedProducts />
          </Suspense>
        </SectionErrorBoundary>
      </section>
    </PageShell>
  );
}
