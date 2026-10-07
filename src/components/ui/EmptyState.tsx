import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line bg-surface-subtle px-6 py-10 text-center">
      <p className="text-card-title font-extrabold text-ink">{title}</p>
      {description && (
        <p className="max-w-sm text-body text-ink-subtle">{description}</p>
      )}
      {action}
    </div>
  );
}
