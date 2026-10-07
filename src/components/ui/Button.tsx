import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary";

const base =
  "inline-flex h-[42px] min-w-[88px] items-center justify-center gap-1.5 rounded-md border px-[18px] text-button font-bold transition duration-200 hover:-translate-y-0.5";

const variants: Record<Variant, string> = {
  primary:
    "border-primary bg-primary text-white shadow-primary hover:bg-primary-hover hover:shadow-primary-hover",
  secondary:
    "border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-surface-hover",
};

export function buttonClasses(variant: Variant, className?: string) {
  return cn(base, variants[variant], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant };

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, className)}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant };

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
