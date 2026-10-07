import Link from "next/link";
import { Suspense } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { LaunchedProducts } from "@/components/products/LaunchedProducts";
import { ProductListSkeleton } from "@/components/products/ProductListSkeleton";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { TrendingTopicsBar } from "@/components/topics/TrendingTopicsBar";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";
import { SectionHeading } from "@/components/ui/SectionHeading";

export default function Home() {
  return (
    <PageShell>
      <TrendingTopicsBar />

      <div className="mt-9 grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section
          aria-labelledby="destaques"
          className="pt-1 pb-8 lg:pr-[46px] lg:pl-2"
        >
          <SectionHeading
            as="h1"
            id="destaques"
            eyebrow="Destaques de hoje"
            title={
              <>
                O Próximo Grande App{" "}
                <span aria-hidden="true" className="inline-block text-primary">
                  ↓
                </span>
              </>
            }
            action={
              <Link
                href="/produtos"
                className="group shrink-0 pb-[5px] text-caption font-bold text-primary"
              >
                Ver todos{" "}
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            }
          />
          <SectionErrorBoundary title="Não foi possível carregar os produtos">
            <Suspense fallback={<ProductListSkeleton />}>
              <LaunchedProducts />
            </Suspense>
          </SectionErrorBoundary>
        </section>

        <Sidebar />
      </div>
    </PageShell>
  );
}
