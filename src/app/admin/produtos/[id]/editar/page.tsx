import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  AdminHeadingSkeleton,
  ProductFormSkeleton,
} from "@/components/admin/AdminSkeletons";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { requireAdminPage } from "@/server/auth";
import { NotFoundError, ValidationError } from "@/server/errors";
import { adminProductService } from "@/server/services/adminProductService";

export const metadata: Metadata = {
  title: "Admin · Editar produto",
  robots: { index: false },
};

export default function EditarProdutoPage({
  params,
}: PageProps<"/admin/produtos/[id]/editar">) {
  return (
    <PageShell>
      <section aria-labelledby="editar-produto" className="pt-9 pb-8 md:px-2">
        <Suspense
          fallback={
            <>
              <AdminHeadingSkeleton />
              <ProductFormSkeleton />
            </>
          }
        >
          <EditProduct params={params} />
        </Suspense>
      </section>
    </PageShell>
  );
}

async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/produtos/${encodeURIComponent(id)}/editar`);

  // Id que não é UUID ou produto removido: 404.
  const product = await adminProductService.get(id).catch((error: unknown) => {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      notFound();
    }
    throw error;
  });

  return (
    <>
      <SectionHeading
        as="h1"
        id="editar-produto"
        eyebrow="Área admin"
        title={`Editar ${product.title}`}
      />
      <ProductForm product={product} />
    </>
  );
}
