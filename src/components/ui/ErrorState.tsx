"use client";

import { Button } from "./Button";

type ErrorStateProps = {
  title: string;
  description?: string;
  onRetry: () => void;
};

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-line bg-surface-subtle px-6 py-10 text-center"
    >
      <p className="text-card-title font-extrabold text-ink">{title}</p>
      {description && (
        <p className="max-w-sm text-body text-ink-subtle">{description}</p>
      )}
      <Button variant="secondary" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}
