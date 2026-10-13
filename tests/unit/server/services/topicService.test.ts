import { describe, expect, it } from "vitest";

import { createTopicService } from "@/server/services/topicService";

describe("topicService.listWithProductCount", () => {
  it("converte para TopicWithCountDTO na ordem do repositório", async () => {
    const service = createTopicService({
      topicRepository: {
        listWithProductCount: async () => [
          { slug: "ia", name: "Inteligência artificial", productCount: 1 },
          { slug: "saas", name: "SaaS", productCount: 3 },
        ],
      },
    });

    expect(await service.listWithProductCount()).toEqual([
      { slug: "ia", name: "Inteligência artificial", productCount: 1 },
      { slug: "saas", name: "SaaS", productCount: 3 },
    ]);
  });
});
