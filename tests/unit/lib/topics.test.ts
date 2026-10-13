import { describe, expect, it } from "vitest";

import { SEED_TOPICS, sortTopicsByName, TOPIC_SLUGS } from "@/lib/topics";

describe("SEED_TOPICS", () => {
  it("tem exatamente os 5 topics do seed do CLAUDE.md", () => {
    expect(SEED_TOPICS).toEqual([
      { slug: "ia", name: "Inteligência artificial" },
      { slug: "produtividade", name: "Produtividade" },
      { slug: "marketing", name: "Marketing" },
      { slug: "saas", name: "SaaS" },
      { slug: "tech", name: "Tech" },
    ]);
  });

  it("expõe os slugs para validação", () => {
    expect(TOPIC_SLUGS).toEqual([
      "ia",
      "produtividade",
      "marketing",
      "saas",
      "tech",
    ]);
  });
});

describe("sortTopicsByName", () => {
  it("ordena pelo nome em pt-BR, sem alterar a lista original", () => {
    const topics = [
      { slug: "tech", name: "Tech" },
      { slug: "saas", name: "SaaS" },
      { slug: "ia", name: "Inteligência artificial" },
    ];

    expect(sortTopicsByName(topics).map((topic) => topic.slug)).toEqual([
      "ia",
      "saas",
      "tech",
    ]);
    expect(topics[0]?.slug).toBe("tech");
  });
});
