"use client";

import { catchError, type ErrorInfo } from "next/error";

import { ErrorState } from "./ErrorState";

function SectionErrorFallback(
  { title }: { title: string },
  { retry }: ErrorInfo,
) {
  return (
    <div className="mt-6">
      <ErrorState
        title={title}
        description="Tente de novo em instantes."
        onRetry={retry}
      />
    </div>
  );
}

/** Isola o erro de uma seção: o resto da página continua funcionando. */
export const SectionErrorBoundary = catchError(SectionErrorFallback);
