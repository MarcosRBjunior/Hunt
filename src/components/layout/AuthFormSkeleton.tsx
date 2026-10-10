import { Skeleton } from "@/components/ui/Skeleton";

/** Lugar do card de login/registro do Clerk enquanto ele carrega. */
export function AuthFormSkeleton() {
  return (
    <div role="status" aria-label="Carregando" className="w-full max-w-[400px]">
      <Skeleton className="h-[480px] w-full rounded-xl" />
    </div>
  );
}
