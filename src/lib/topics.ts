/** Os 5 topics fixos do seed (CLAUDE.md › Modelo de dados). */
export const SEED_TOPICS = [
  { slug: "ia", name: "Inteligência artificial" },
  { slug: "produtividade", name: "Produtividade" },
  { slug: "marketing", name: "Marketing" },
  { slug: "saas", name: "SaaS" },
  { slug: "tech", name: "Tech" },
] as const;

export type TopicSlug = (typeof SEED_TOPICS)[number]["slug"];

export const TOPIC_SLUGS = SEED_TOPICS.map((topic) => topic.slug) as [
  TopicSlug,
  ...TopicSlug[],
];

/** Os topics são só os 5 do seed (regra 10): qualquer outro slug não existe. */
export function isTopicSlug(slug: string): slug is TopicSlug {
  return (TOPIC_SLUGS as readonly string[]).includes(slug);
}

/** Ordem de exibição dos topics (barra, categorias e tags dos cards): alfabética pelo nome. */
export function sortTopicsByName<T extends { name: string }>(
  topics: readonly T[],
): T[] {
  return topics.toSorted((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export const TOPICS_BY_NAME = sortTopicsByName(SEED_TOPICS);
