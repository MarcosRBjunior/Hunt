import { ProductLogo } from "@/components/products/ProductLogo";
import { Rating } from "@/components/sidebar/Rating";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, formatNumber } from "@/lib/utils";
import type { AdminProductDTO, ProductStatus } from "@/types/api";

import { DeleteProductButton } from "./DeleteProductButton";

const STATUS: Record<ProductStatus, { label: string; className: string }> = {
  LAUNCHED: {
    label: "Lançado",
    className: "bg-surface-tag text-ink-muted",
  },
  UPCOMING: {
    label: "Em breve",
    className: "bg-primary-subtle text-primary-hover",
  },
};

// Fuso fixo: o servidor da Vercel roda em UTC.
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const cell = "px-4 py-3 align-middle";

/** Produtos da área admin, de qualquer status, com a nota da revisão. */
export function AdminProductTable({
  products,
}: {
  products: AdminProductDTO[];
}) {
  if (products.length === 0) {
    return (
      <div className="mt-[22px]">
        <EmptyState
          title="Nenhum produto cadastrado"
          description="Cadastre o primeiro produto para ele aparecer na home."
          action={
            <ButtonLink href="/admin/produtos/novo" className="mt-2">
              Cadastrar produto
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="mt-[22px] overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[920px] border-collapse text-left text-body text-ink-muted">
        <caption className="sr-only">Produtos cadastrados</caption>
        <thead className="bg-surface-subtle text-caption font-extrabold tracking-[0.6px] text-ink-subtle uppercase">
          <tr>
            <th scope="col" className={cell}>
              Produto
            </th>
            <th scope="col" className={cell}>
              Status
            </th>
            <th scope="col" className={cn(cell, "text-right")}>
              Votos
            </th>
            <th scope="col" className={cn(cell, "text-right")}>
              Visitas
            </th>
            <th scope="col" className={cell}>
              Topics
            </th>
            <th scope="col" className={cell}>
              Nota
            </th>
            <th scope="col" className={cell}>
              Criado em
            </th>
            <th scope="col" className={cell}>
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft bg-surface">
          {products.map((product) => (
            <tr key={product.id}>
              <th scope="row" className={cell}>
                <div className="flex items-center gap-3">
                  <ProductLogo product={product} variant="coming" />
                  <span className="text-nav font-bold text-ink">
                    {product.title}
                  </span>
                </div>
              </th>
              <td className={cell}>
                <span
                  className={cn(
                    "rounded-xs px-2 py-1 text-caption font-bold whitespace-nowrap",
                    STATUS[product.status].className,
                  )}
                >
                  {STATUS[product.status].label}
                </span>
              </td>
              <td className={cn(cell, "text-right tabular-nums")}>
                {formatNumber(product.upvotes)}
              </td>
              <td className={cn(cell, "text-right tabular-nums")}>
                {formatNumber(product.visits)}
              </td>
              <td className={cell}>
                {product.topics.length > 0
                  ? product.topics.map((topic) => topic.name).join(", ")
                  : "—"}
              </td>
              <td className={cn(cell, "whitespace-nowrap")}>
                {product.review ? (
                  <Rating value={product.review.rating} />
                ) : (
                  "—"
                )}
              </td>
              <td className={cn(cell, "whitespace-nowrap")}>
                <time dateTime={product.createdAt}>
                  {dateFormat.format(new Date(product.createdAt))}
                </time>
              </td>
              <td className={cell}>
                <div className="flex justify-end gap-2">
                  <ButtonLink
                    href={`/admin/produtos/${product.id}/editar`}
                    variant="secondary"
                    aria-label={`Editar ${product.title}`}
                    className="min-w-0"
                  >
                    Editar
                  </ButtonLink>
                  <DeleteProductButton
                    productId={product.id}
                    title={product.title}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
