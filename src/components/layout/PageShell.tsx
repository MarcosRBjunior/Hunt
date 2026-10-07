import type { ReactNode } from "react";

import type { NavKey } from "@/lib/site";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function PageShell({
  active,
  children,
}: {
  active?: NavKey;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto my-3 flex min-h-[calc(100vh-24px)] w-[calc(100%-24px)] max-w-[1360px] flex-col rounded-xl border border-line-shell bg-shell px-4 pt-1 pb-[18px] shadow-shell backdrop-blur-[20px] sm:rounded-shell sm:px-5 md:my-5 md:min-h-[calc(100vh-40px)] md:w-[calc(100%-48px)] md:px-[34px] md:pt-2.5 md:pb-5">
      <a
        href="#conteudo"
        className="sr-only rounded-md bg-primary px-4 py-2 text-button font-bold text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-10"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader active={active} />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
