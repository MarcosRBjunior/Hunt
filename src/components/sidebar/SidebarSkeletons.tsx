import { Skeleton } from "@/components/ui/Skeleton";

export function ReviewedProductsSkeleton() {
  return (
    <div role="status" className="mt-[22px] grid gap-2.5">
      <span className="sr-only">Carregando produtos revisados…</span>
      <Skeleton className="h-[112px] rounded-lg" />
      <Skeleton className="h-[112px] rounded-lg" />
    </div>
  );
}

export function ComingSoonSkeleton() {
  return (
    <div role="status" className="mt-[18px]">
      <span className="sr-only">Carregando lançamentos…</span>
      <Skeleton className="h-[132px] rounded-xl" />
    </div>
  );
}
