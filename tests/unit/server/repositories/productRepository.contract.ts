import { describe, expect, it } from "vitest";

import type {
  Product,
  ProductRepository,
} from "@/server/repositories/productRepository";
import { buildProduct } from "../../../helpers/buildProduct";

/**
 * Contrato que toda implementação de ProductRepository precisa cumprir.
 * Roda contra o mock (nível 1) e contra o Prisma (Fase 5).
 */
export function describeProductRepositoryContract(
  name: string,
  setup: (products: Product[]) => Promise<ProductRepository>,
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
  });
}
