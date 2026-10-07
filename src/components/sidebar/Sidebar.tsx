import { connection } from "next/server";
import { Suspense } from "react";

import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { productService } from "@/server/services/productService";

import { ComingSoonList } from "./ComingSoonList";
import { ReviewedProducts } from "./ReviewedProducts";
import {
  ComingSoonSkeleton,
  ReviewedProductsSkeleton,
} from "./SidebarSkeletons";

async function ReviewedProductsData() {
  await connection();
  return <ReviewedProducts products={await productService.listReviewed()} />;
}

async function ComingSoonData() {
  await connection();
  return <ComingSoonList products={await productService.listUpcoming()} />;
}

export function Sidebar() {
  return (
    <aside
      aria-label="Escolhas da equipe"
      className="border-t border-line pt-8 pb-5 lg:border-t-0 lg:border-l lg:pt-1 lg:pr-2 lg:pl-[42px]"
    >
      <section aria-labelledby="revisados">
        <div className="flex items-center justify-between gap-3">
          <SectionHeading
            id="revisados"
            eyebrow="Escolha da equipe"
            title="Produtos revisados por nós"
          />
          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-subtle-strong text-body font-extrabold text-primary"
          >
            ✓
          </span>
        </div>
        <SectionErrorBoundary title="Não foi possível carregar as revisões">
          <Suspense fallback={<ReviewedProductsSkeleton />}>
            <ReviewedProductsData />
          </Suspense>
        </SectionErrorBoundary>
      </section>

      <section aria-labelledby="em-breve" className="mt-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3.5">
          <span aria-hidden="true" className="h-px bg-line-soft" />
          <h2
            id="em-breve"
            className="text-caption font-extrabold tracking-[1.3px] text-ink-subtle uppercase"
          >
            Em breve
          </h2>
          <span aria-hidden="true" className="h-px bg-line-soft" />
        </div>
        <SectionErrorBoundary title="Não foi possível carregar os lançamentos">
          <Suspense fallback={<ComingSoonSkeleton />}>
            <ComingSoonData />
          </Suspense>
        </SectionErrorBoundary>
      </section>
    </aside>
  );
}
