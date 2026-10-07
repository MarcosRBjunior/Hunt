import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "mb-2 block text-caption font-extrabold tracking-[1.5px] text-ink-subtle uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}
