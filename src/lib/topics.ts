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

/** Ordem de exibição: alfabética pelo nome, como no wireframe. */
export const TOPICS_BY_NAME = [...SEED_TOPICS].sort((a, b) =>
  a.name.localeCompare(b.name, "pt-BR"),
);
