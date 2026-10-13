import { describe, expect, it } from "vitest";

import type { TopicRepository } from "@/server/repositories/topicRepository";
import { buildProduct, type ProductFixture } from "./buildProduct";

const SAAS = { slug: "saas", name: "SaaS" };
const TECH = { slug: "tech", name: "Tech" };

/**
 * Contrato que toda implementação de TopicRepository precisa cumprir.
 * Roda contra o mock e contra o Prisma (com os 5 topics do seed).
 */
export function describeTopicRepositoryContract(
  name: string,
  setup: (products: ProductFixture[]) => Promise<TopicRepository>,
) {
  describe(`${name} cumpre o contrato de TopicRepository`, () => {
    it("lista os 5 topics em ordem alfabética, com 0 produtos sem cadastro", async () => {
      const repository = await setup([]);

      expect(await repository.listWithProductCount()).toEqual([
        { slug: "ia", name: "Inteligência artificial", productCount: 0 },
        { slug: "marketing", name: "Marketing", productCount: 0 },
        { slug: "produtividade", name: "Produtividade", productCount: 0 },
        { slug: "saas", name: "SaaS", productCount: 0 },
        { slug: "tech", name: "Tech", productCount: 0 },
      ]);
    });

    it("conta só os produtos LAUNCHED de cada topic", async () => {
      const repository = await setup([
        buildProduct({ topics: [SAAS, TECH] }),
        buildProduct({ topics: [SAAS] }),
        buildProduct({ status: "UPCOMING", topics: [SAAS, TECH] }),
        buildProduct({ topics: [] }),
      ]);

      const counts = Object.fromEntries(
        (await repository.listWithProductCount()).map((topic) => [
          topic.slug,
          topic.productCount,
        ]),
      );

      expect(counts).toEqual({
        ia: 0,
        marketing: 0,
        produtividade: 0,
        saas: 2,
        tech: 1,
      });
    });
  });
}
