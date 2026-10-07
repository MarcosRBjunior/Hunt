import Link from "next/link";

import { SparkIcon } from "@/components/ui/icons";
import { SITE_NAME } from "@/lib/site";

export function Logo() {
  return (
    <Link
      href="/"
      aria-label={`${SITE_NAME}, página inicial`}
      className="inline-flex w-fit items-center gap-2.5 rounded-sm text-logo font-extrabold tracking-[-0.8px] text-ink"
    >
      <span className="grid size-[34px] -rotate-6 place-items-center rounded-sm bg-primary text-white shadow-logo">
        <SparkIcon className="w-5" />
      </span>
      <span>{SITE_NAME}</span>
    </Link>
  );
}
