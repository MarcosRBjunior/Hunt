import { TOPICS_BY_NAME } from "@/lib/topics";

/** Só visual no nível 1; o filtro por topic chega na Fase 10. */
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
      <ul className="flex flex-wrap gap-2">
        {TOPICS_BY_NAME.map((topic) => (
          <li
            key={topic.slug}
            className="rounded-pill border border-line bg-surface px-[17px] py-2 text-body font-semibold whitespace-nowrap text-ink-muted"
          >
            {topic.name}
          </li>
        ))}
      </ul>
      <span className="ml-auto text-caption whitespace-nowrap text-ink-subtle max-lg:hidden">
        Atualizado agora
      </span>
    </section>
  );
}
