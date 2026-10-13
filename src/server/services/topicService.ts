import type { TopicWithCountDTO } from "@/types/api";

import { topicRepository } from "../repositories";
import type { TopicRepository } from "../repositories/topicRepository";

type Dependencies = {
  topicRepository: TopicRepository;
};

export function createTopicService({ topicRepository }: Dependencies) {
  return {
    /** Os 5 topics, em ordem alfabética, com a contagem de produtos lançados. */
    async listWithProductCount(): Promise<TopicWithCountDTO[]> {
      const topics = await topicRepository.listWithProductCount();
      return topics.map(({ slug, name, productCount }) => ({
        slug,
        name,
        productCount,
      }));
    },
  };
}

export type TopicService = ReturnType<typeof createTopicService>;

export const topicService = createTopicService({ topicRepository });
