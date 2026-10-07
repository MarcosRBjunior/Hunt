import type { ReactNode } from "react";

import { Eyebrow } from "./Eyebrow";

type SectionHeadingProps = {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  as?: "h1" | "h2";
  action?: ReactNode;
};

export function SectionHeading({
  id,
  eyebrow,
  title,
  as: Heading = "h2",
  action,
}: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading
          id={id}
          className={
            Heading === "h1"
              ? "text-display font-normal text-ink"
              : "max-w-60 text-title font-normal text-balance text-ink"
          }
        >
          {title}
        </Heading>
      </div>
      {action}
    </div>
  );
}
