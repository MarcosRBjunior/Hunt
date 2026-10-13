"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { TOPICS_BY_NAME } from "@/lib/topics";
import { cn } from "@/lib/utils";

/**
 * Filtro da lista principal por topic, com o estado na URL (`/?topic=slug`).
 * Um topic por vez (regra 10): clicar no ativo tira o filtro. Os chips são
 * links, então funcionam mesmo antes do JavaScript carregar.
 */
export function TrendingTopicsBar() {
  return (
    <section
      aria-labelledby="trending-topics"
      className="mt-[22px] flex min-h-[68px] flex-col items-start gap-3 rounded-lg border border-line bg-surface-subtle px-4 py-3 sm:flex-row sm:items-center sm:gap-[26px]"
    >
      <div className="flex items-center gap-[9px] whitespace-nowrap">
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-live shadow-live-ring"
        />
        <strong
          id="trending-topics"
          className="text-body tracking-[-0.1px] text-ink"
        >
          Trending topics
        </strong>
      </div>
      {/* A query string só existe na requisição: o HTML pré-renderizado sai
          sem chip ativo, e o ativo aparece assim que a URL é lida. */}
      <Suspense fallback={<TopicChips activeSlug={null} />}>
        <TopicChipsFromUrl />
      </Suspense>
      <span className="ml-auto text-caption whitespace-nowrap text-ink-subtle max-lg:hidden">
        Atualizado agora
      </span>
    </section>
  );
}

function TopicChipsFromUrl() {
  return <TopicChips activeSlug={useSearchParams().get("topic")} />;
}

function TopicChips({ activeSlug }: { activeSlug: string | null }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {TOPICS_BY_NAME.map((topic) => {
        const active = topic.slug === activeSlug;

        return (
          <li key={topic.slug}>
            <Link
              href={active ? "/" : `/?topic=${topic.slug}`}
              scroll={false}
              aria-current={active ? "true" : undefined}
              aria-label={active ? `${topic.name} (remover filtro)` : undefined}
              className={cn(
                "block rounded-pill border px-[17px] py-2 text-body font-semibold whitespace-nowrap transition-colors duration-200",
                active
                  ? "border-primary bg-primary text-white hover:border-primary-hover hover:bg-primary-hover"
                  : "border-line bg-surface text-ink-muted hover:border-primary-border hover:bg-primary-subtle hover:text-primary",
              )}
            >
              {topic.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
