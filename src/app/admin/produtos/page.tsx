import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminProductTable } from "@/components/admin/AdminProductTable";
import {
  AdminHeadingSkeleton,
  AdminTableSkeleton,
} from "@/components/admin/AdminSkeletons";
import { PageShell } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { requireAdminPage } from "@/server/auth";
import { adminProductService } from "@/server/services/adminProductService";

export const metadata: Metadata = {
  title: "Admin · Produtos",
  robots: { index: false },
};

export default function AdminProdutosPage() {
  return (
    <PageShell>
      <section aria-labelledby="admin-produtos" className="pt-9 pb-8 md:px-2">
        <Suspense
          fallback={
            <>
              <AdminHeadingSkeleton />
              <AdminTableSkeleton />
            </>
          }
        >
          <AdminProducts />
        </Suspense>
      </section>
    </PageShell>
  );
}

/** Nada da área admin aparece antes de o papel ser conferido no servidor. */
async function AdminProducts() {
  await requireAdminPage("/admin/produtos");

  return (
    <>
      <SectionHeading
        as="h1"
        id="admin-produtos"
        eyebrow="Área admin"
        title="Produtos"
        action={
          <ButtonLink href="/admin/produtos/novo" className="shrink-0">
            Novo produto
          </ButtonLink>
        }
      />
      <SectionErrorBoundary title="Não foi possível carregar os produtos">
        <Suspense fallback={<AdminTableSkeleton />}>
          <AdminProductList />
        </Suspense>
      </SectionErrorBoundary>
    </>
  );
}

async function AdminProductList() {
  const products = await adminProductService.list();

  return <AdminProductTable products={products} />;
}
