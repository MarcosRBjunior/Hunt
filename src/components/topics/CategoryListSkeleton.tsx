import { Skeleton } from "@/components/ui/Skeleton";

export function CategoryListSkeleton() {
  return (
    <div
      role="status"
      className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <span className="sr-only">Carregando categorias…</span>
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-[86px] rounded-lg" />
      ))}
    </div>
  );
}
