import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { NAV_ITEMS, type NavKey } from "@/lib/site";

import { Logo } from "./Logo";

export function SiteHeader({ active }: { active?: NavKey }) {
  return (
    <header className="grid grid-cols-[1fr_auto] items-center gap-x-4 border-b border-line [grid-template-areas:'logo_actions'_'nav_nav'] lg:h-[76px] lg:grid-cols-[1fr_auto_1fr] lg:[grid-template-areas:'logo_nav_actions']">
      <div className="py-3 [grid-area:logo] lg:py-0">
        <Logo />
      </div>

      <nav
        aria-label="Navegação principal"
        className="flex items-center gap-7 [grid-area:nav] lg:gap-9"
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={item.key === active ? "page" : undefined}
            className="relative py-3 text-nav font-semibold text-ink-subtle transition-colors duration-200 after:absolute after:bottom-[-1px] after:left-1/2 after:hidden after:h-0.5 after:w-[22px] after:-translate-x-1/2 after:rounded-indicator after:bg-primary hover:text-ink aria-[current=page]:text-ink aria-[current=page]:after:block lg:py-[27px]"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex justify-end gap-2 [grid-area:actions]">
        <ButtonLink
          href="/sign-in"
          prefetch={false}
          variant="secondary"
          className="max-sm:hidden"
        >
          Login
        </ButtonLink>
        <ButtonLink href="/sign-up" prefetch={false} className="max-sm:min-w-0">
          Registro <span aria-hidden="true">→</span>
        </ButtonLink>
      </div>
    </header>
  );
}
