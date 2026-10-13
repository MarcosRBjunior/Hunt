import type { Metadata } from "next";
import { Suspense } from "react";

import {
  AdminHeadingSkeleton,
  ProductFormSkeleton,
} from "@/components/admin/AdminSkeletons";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { requireAdminPage } from "@/server/auth";

export const metadata: Metadata = {
  title: "Admin · Novo produto",
  robots: { index: false },
};

export default function NovoProdutoPage() {
  return (
    <PageShell>
      <section aria-labelledby="novo-produto" className="pt-9 pb-8 md:px-2">
        <Suspense
          fallback={
            <>
              <AdminHeadingSkeleton />
              <ProductFormSkeleton />
            </>
          }
        >
          <NewProduct />
        </Suspense>
      </section>
    </PageShell>
  );
}

async function NewProduct() {
  await requireAdminPage("/admin/produtos/novo");

  return (
    <>
      <SectionHeading
        as="h1"
        id="novo-produto"
        eyebrow="Área admin"
        title="Novo produto"
      />
      <ProductForm />
    </>
  );
}
