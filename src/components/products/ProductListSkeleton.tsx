import { Skeleton } from "@/components/ui/Skeleton";

export function ProductListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" className="mt-[22px] grid gap-2.5">
      <span className="sr-only">Carregando produtos…</span>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="grid min-h-[104px] grid-cols-[58px_minmax(0,1fr)_48px] items-center gap-[11px] py-3.5 pr-3 pl-2 sm:grid-cols-[28px_68px_minmax(0,1fr)_58px] sm:gap-4 sm:pr-4 sm:pl-3"
        >
          <Skeleton className="h-3 w-4 max-sm:hidden" />
          <Skeleton className="size-[58px] rounded-lg" />
          <div className="grid gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full max-w-md" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-[62px] w-12 justify-self-end rounded-upvote sm:w-[54px]" />
        </div>
      ))}
    </div>
  );
}
