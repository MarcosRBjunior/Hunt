import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { CategoryList } from "@/components/topics/CategoryList";
import { CategoryListSkeleton } from "@/components/topics/CategoryListSkeleton";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";
import { topicService } from "@/server/services/topicService";

export const metadata: Metadata = {
  title: "Categorias",
};

async function CategoriesData() {
  // A contagem muda quando o admin salva um produto: sem cache.
  await connection();
  return <CategoryList topics={await topicService.listWithProductCount()} />;
}

export default function CategoriasPage() {
  return (
    <PageShell active="categorias">
      <section className="py-9 md:px-2">
        <Eyebrow>Trending topics</Eyebrow>
        <h1 className="text-display font-normal text-ink">Categorias</h1>
        <p className="mt-3 max-w-xl text-nav text-ink-subtle">
          Os assuntos que organizam os produtos da vitrine. Um produto pode
          estar em mais de uma categoria; clique em uma para ver os produtos
          lançados dela.
        </p>

        <SectionErrorBoundary title="Não foi possível carregar as categorias">
          <Suspense fallback={<CategoryListSkeleton />}>
            <CategoriesData />
          </Suspense>
        </SectionErrorBoundary>
      </section>
    </PageShell>
  );
}
