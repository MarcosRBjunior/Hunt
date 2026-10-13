import Link from "next/link";

import { EmptyState } from "@/components/ui/EmptyState";
import { plural } from "@/lib/utils";
import type { TopicWithCountDTO } from "@/types/api";

/** Os topics com a contagem de produtos lançados; cada um filtra a home. */
export function CategoryList({ topics }: { topics: TopicWithCountDTO[] }) {
  if (topics.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          title="Nenhuma categoria por enquanto"
          description="Assim que as categorias forem cadastradas, elas aparecem aqui."
        />
      </div>
    );
  }

  return (
    <ul
      aria-label="Categorias"
      className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {topics.map((topic) => (
        <li key={topic.slug}>
          <Link
            href={`/?topic=${topic.slug}`}
            className="group flex h-full items-center justify-between gap-3 rounded-lg border border-line-soft bg-surface-subtle p-[18px] transition-colors duration-200 hover:border-primary-border hover:bg-primary-subtle"
          >
            <span className="grid gap-1">
              <span className="text-card-title font-extrabold tracking-[-0.3px] text-ink transition-colors duration-200 group-hover:text-primary">
                {topic.name}
              </span>
              <span className="text-body text-ink-subtle">
                {plural(topic.productCount, "produto", "produtos")}
              </span>
            </span>
            <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption font-bold text-ink-muted">
              #{topic.slug}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
