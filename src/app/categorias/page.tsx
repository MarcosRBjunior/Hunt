import type { Metadata } from "next";

import { PageShell } from "@/components/layout/PageShell";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TOPICS_BY_NAME } from "@/lib/topics";

export const metadata: Metadata = {
  title: "Categorias",
};

export default function CategoriasPage() {
  return (
    <PageShell active="categorias">
      <section className="py-9 md:px-2">
        <Eyebrow>Trending topics</Eyebrow>
        <h1 className="text-display font-bold text-ink">Categorias</h1>
        <p className="mt-3 max-w-xl text-nav text-ink-subtle">
          Os assuntos que organizam os produtos da vitrine. Um produto pode
          estar em mais de uma categoria.
        </p>

        <ul
          aria-label="Categorias"
          className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {TOPICS_BY_NAME.map((topic) => (
            <li
              key={topic.slug}
              className="flex items-center justify-between gap-3 rounded-lg border border-line-soft bg-surface-subtle p-[18px]"
            >
              <span className="text-card-title font-extrabold tracking-[-0.3px] text-ink">
                {topic.name}
              </span>
              <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption font-bold text-ink-muted">
                #{topic.slug}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
