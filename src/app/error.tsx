"use client";

import { useEffect } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { ErrorState } from "@/components/ui/ErrorState";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell>
      <div className="py-12">
        <ErrorState
          title="Algo deu errado"
          description="Não conseguimos carregar esta página. Tente de novo em instantes."
          onRetry={retry}
        />
      </div>
    </PageShell>
  );
}
