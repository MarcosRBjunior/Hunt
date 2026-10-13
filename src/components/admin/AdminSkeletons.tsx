import { Skeleton } from "@/components/ui/Skeleton";

/** Título da página enquanto a sessão de admin é conferida. */
export function AdminHeadingSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-9 w-56" />
    </div>
  );
}

export function AdminTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" className="mt-[22px] grid gap-2">
      <span className="sr-only">Carregando produtos…</span>
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function ProductFormSkeleton() {
  return (
    <div role="status" className="mt-8 grid max-w-2xl gap-6">
      <span className="sr-only">Carregando formulário…</span>
      {["h-[42px]", "h-28", "h-[42px]", "h-[42px]"].map((height, index) => (
        <div key={index} className="grid gap-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className={`w-full ${height}`} />
        </div>
      ))}
    </div>
  );
}
