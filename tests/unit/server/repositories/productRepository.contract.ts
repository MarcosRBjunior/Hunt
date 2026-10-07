import { describe, expect, it } from "vitest";

import type { ProductRepository } from "@/server/repositories/productRepository";
import {
  buildProduct,
  type ProductFixture,
} from "../../../helpers/buildProduct";

/**
 * Contrato que toda implementação de ProductRepository precisa cumprir.
 * Roda contra o mock (nível 1) e contra o Prisma (Fase 5).
 */
export function describeProductRepositoryContract(
  name: string,
  setup: (products: ProductFixture[]) => Promise<ProductRepository>,
) {
  describe(`${name} cumpre o contrato de ProductRepository`, () => {
    it("TC-01: lista em ordem decrescente de upvotes", async () => {
      const repository = await setup(
        [298, 29, 202, 102].map((upvotes) => buildProduct({ upvotes })),
      );

      const products = await repository.listLaunched();

      expect(products.map((product) => product.upvotes)).toEqual([
        298, 202, 102, 29,
      ]);
    });

    it("TC-02: no empate de votos, o mais recente vem primeiro", async () => {
      const older = buildProduct({
        title: "Antigo",
        upvotes: 10,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      });
      const newer = buildProduct({
        title: "Recente",
        upvotes: 10,
        createdAt: new Date("2026-02-01T00:00:00.000Z"),
      });
      const repository = await setup([older, newer]);

      const products = await repository.listLaunched();

      expect(products.map((product) => product.title)).toEqual([
        "Recente",
        "Antigo",
      ]);
    });

    it("TC-03: devolve todos os 60 produtos numa resposta só", async () => {
      const repository = await setup(
        Array.from({ length: 60 }, (_, index) =>
          buildProduct({ upvotes: index }),
        ),
      );

      const products = await repository.listLaunched();

      expect(products).toHaveLength(60);
    });

    it("deixa produtos UPCOMING fora da lista principal", async () => {
      const repository = await setup([
        buildProduct({ title: "Lançado", status: "LAUNCHED" }),
        buildProduct({ title: "Em breve", status: "UPCOMING", upvotes: 999 }),
      ]);

      const products = await repository.listLaunched();

      expect(products.map((product) => product.title)).toEqual(["Lançado"]);
    });

    it("listReviewed: só revisados, por nota decrescente, até o limite", async () => {
      const repository = await setup([
        buildProduct({ title: "Sem revisão", upvotes: 500 }),
        buildProduct({ title: "Nota 3", review: { rating: 3, summary: null } }),
        buildProduct({
          title: "Nota 5",
          review: { rating: 5, summary: "Ótimo" },
        }),
        buildProduct({ title: "Nota 4", review: { rating: 4, summary: null } }),
        buildProduct({ title: "Nota 1", review: { rating: 1, summary: null } }),
      ]);

      const reviewed = await repository.listReviewed(3);

      expect(reviewed.map((product) => product.title)).toEqual([
        "Nota 5",
        "Nota 4",
        "Nota 3",
      ]);
      expect(reviewed[0]?.review).toEqual({ rating: 5, summary: "Ótimo" });
    });

    it("listReviewed: na mesma nota, o mais recente vem primeiro", async () => {
      const repository = await setup([
        buildProduct({
          title: "Antigo",
          review: { rating: 5, summary: null },
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        }),
        buildProduct({
          title: "Recente",
          review: { rating: 5, summary: null },
          createdAt: new Date("2026-02-01T00:00:00.000Z"),
        }),
      ]);

      const reviewed = await repository.listReviewed(3);

      expect(reviewed.map((product) => product.title)).toEqual([
        "Recente",
        "Antigo",
      ]);
    });

    it("listUpcoming: só UPCOMING, do mais recente para o mais antigo", async () => {
      const repository = await setup([
        buildProduct({ title: "Lançado", status: "LAUNCHED" }),
        buildProduct({
          title: "Em breve antigo",
          status: "UPCOMING",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        }),
        buildProduct({
          title: "Em breve recente",
          status: "UPCOMING",
          createdAt: new Date("2026-02-01T00:00:00.000Z"),
        }),
      ]);

      const upcoming = await repository.listUpcoming();

      expect(upcoming.map((product) => product.title)).toEqual([
        "Em breve recente",
        "Em breve antigo",
      ]);
    });
  });
}
