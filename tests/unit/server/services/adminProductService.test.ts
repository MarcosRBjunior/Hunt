import { describe, expect, it, vi } from "vitest";

import { NotFoundError, ValidationError } from "@/server/errors";
import type {
  NewProduct,
  ProductChanges,
  ProductRepository,
} from "@/server/repositories/productRepository";
import { createAdminProductService } from "@/server/services/adminProductService";

import { buildProduct } from "../../../helpers/buildProduct";
import { stubProductRepository } from "../../../helpers/stubRepositories";

const id = "a59e45f4-7972-4bf3-ae41-0d6136c45f8c";

const validBody = {
  title: "Layer",
  description: "A API visual.",
  url: "https://layer.example.com",
};

function serviceWith(methods: Partial<ProductRepository>) {
  return createAdminProductService({
    productRepository: stubProductRepository(methods),
  });
}

describe("adminProductService.list", () => {
  it("lista todos os produtos como ProductDTO, na ordem do repositório", async () => {
    const service = serviceWith({
      listAll: async () => [
        buildProduct({ title: "Em breve", status: "UPCOMING" }),
        buildProduct({ title: "Lançado" }),
      ],
    });

    const products = await service.list();

    expect(products.map(({ title, status }) => [title, status])).toEqual([
      ["Em breve", "UPCOMING"],
      ["Lançado", "LAUNCHED"],
    ]);
    expect(products[0]).toHaveProperty("viewerHasVoted", false);
  });

  it("traz a revisão de cada produto (coluna nota), ou null", async () => {
    const service = serviceWith({
      listAll: async () => [
        buildProduct({ review: { rating: 5, summary: "Ótimo" } }),
        buildProduct(),
      ],
    });

    const products = await service.list();

    expect(products.map((product) => product.review)).toEqual([
      { rating: 5, summary: "Ótimo" },
      null,
    ]);
  });
});

describe("adminProductService.get", () => {
  it("devolve o produto de qualquer status, com a revisão", async () => {
    const findWithReview = vi.fn(async () =>
      buildProduct({
        id,
        title: "Em breve",
        status: "UPCOMING",
        review: { rating: 4, summary: "Promissor" },
      }),
    );
    const service = serviceWith({ findWithReview });

    const product = await service.get(id);

    expect(findWithReview).toHaveBeenCalledWith(id);
    expect(product).toMatchObject({
      id,
      title: "Em breve",
      status: "UPCOMING",
      review: { rating: 4, summary: "Promissor" },
    });
  });

  it("responde 404 PRODUCT_NOT_FOUND quando o produto não existe", async () => {
    const service = serviceWith({ findWithReview: async () => null });

    const error = await service.get(id).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toHaveProperty("code", "PRODUCT_NOT_FOUND");
  });

  it("recusa id que não é UUID antes de chegar ao banco", async () => {
    const findWithReview = vi.fn();
    const service = serviceWith({ findWithReview });

    await expect(service.get("abc")).rejects.toBeInstanceOf(ValidationError);
    expect(findWithReview).not.toHaveBeenCalled();
  });
});

describe("adminProductService.saveReview", () => {
  it("grava a nota e o resumo limpo, e devolve a revisão", async () => {
    const upsertReview = vi.fn(
      async (
        _productId: string,
        review: { rating: number; summary: string | null },
      ) => review,
    );
    const service = serviceWith({ upsertReview });

    const review = await service.saveReview(id, {
      rating: 5,
      summary: "  Ótimo  ",
      upvotes: 500,
    });

    expect(upsertReview).toHaveBeenCalledWith(id, {
      rating: 5,
      summary: "Ótimo",
    });
    expect(review).toEqual({ rating: 5, summary: "Ótimo" });
  });

  it("resumo ausente ou vazio vira null", async () => {
    const upsertReview = vi.fn(
      async (
        _productId: string,
        review: { rating: number; summary: string | null },
      ) => review,
    );
    const service = serviceWith({ upsertReview });

    await service.saveReview(id, { rating: 3 });
    await service.saveReview(id, { rating: 3, summary: "   " });

    expect(upsertReview.mock.calls.map(([, review]) => review)).toEqual([
      { rating: 3, summary: null },
      { rating: 3, summary: null },
    ]);
  });

  it.each([0, 6, 4.5, "5", null])(
    "nota %j dá 400 no campo rating, sem gravar",
    async (rating) => {
      const upsertReview = vi.fn();
      const service = serviceWith({ upsertReview });

      const error = await service
        .saveReview(id, { rating })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toHaveProperty("details.fields.rating");
      expect(upsertReview).not.toHaveBeenCalled();
    },
  );

  it("resumo acima de 280 caracteres dá 400 no campo summary", async () => {
    const service = serviceWith({ upsertReview: vi.fn() });

    const error = await service
      .saveReview(id, { rating: 5, summary: "x".repeat(281) })
      .catch((e: unknown) => e);

    expect(error).toHaveProperty("details.fields.summary");
  });

  it("responde 404 PRODUCT_NOT_FOUND quando o produto não existe", async () => {
    const service = serviceWith({ upsertReview: async () => null });

    const error = await service
      .saveReview(id, { rating: 5 })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toHaveProperty("code", "PRODUCT_NOT_FOUND");
  });

  it("recusa id que não é UUID antes de chegar ao banco", async () => {
    const upsertReview = vi.fn();
    const service = serviceWith({ upsertReview });

    await expect(
      service.saveReview("abc", { rating: 5 }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(upsertReview).not.toHaveBeenCalled();
  });
});

describe("adminProductService.create", () => {
  it("cria com os campos validados e os padrões", async () => {
    const create = vi.fn(async (product: NewProduct) =>
      buildProduct({ ...product, id, topics: [] }),
    );
    const service = serviceWith({ create });

    const created = await service.create(validBody);

    expect(create).toHaveBeenCalledWith({
      ...validBody,
      logoUrl: null,
      status: "LAUNCHED",
      topicSlugs: [],
    });
    expect(created).toMatchObject({ id, title: "Layer", upvotes: 0 });
  });

  it("TC-11: upvotes e visits do body nunca chegam ao repositório", async () => {
    const create = vi.fn(async (product: NewProduct) =>
      buildProduct({ ...product, topics: [] }),
    );
    const service = serviceWith({ create });

    await service.create({ ...validBody, upvotes: 500, visits: 999 });

    expect(create.mock.calls[0]?.[0]).not.toHaveProperty("upvotes");
    expect(create.mock.calls[0]?.[0]).not.toHaveProperty("visits");
  });

  it("TC-12: url javascript: dá 400 apontando o campo url, sem gravar", async () => {
    const create = vi.fn();
    const service = serviceWith({ create });

    const error = await service
      .create({ ...validBody, url: "javascript:alert(1)" })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toHaveProperty("details.fields.url");
    expect(create).not.toHaveBeenCalled();
  });

  it("recusa body que não é objeto", async () => {
    const service = serviceWith({});

    await expect(service.create(null)).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("adminProductService.update", () => {
  it("aplica só os campos enviados", async () => {
    const update = vi.fn(async (_id: string, changes: ProductChanges) =>
      buildProduct({ id, title: changes.title }),
    );
    const service = serviceWith({ update });

    const updated = await service.update(id, { title: "Layer 2" });

    expect(update).toHaveBeenCalledWith(id, { title: "Layer 2" });
    expect(updated.title).toBe("Layer 2");
  });

  it("TC-25: visits e upvotes no PATCH são ignorados", async () => {
    const update = vi.fn(async () => buildProduct({ id }));
    const service = serviceWith({ update });

    await service.update(id, { visits: 999, upvotes: 1, title: "X" });

    expect(update).toHaveBeenCalledWith(id, { title: "X" });
  });

  it("produto inexistente: 404 PRODUCT_NOT_FOUND", async () => {
    const service = serviceWith({ update: async () => null });

    const error = await service.update(id, { title: "X" }).catch((e) => e);

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toHaveProperty("code", "PRODUCT_NOT_FOUND");
  });

  it("recusa id inválido e body inválido com 400, sem gravar", async () => {
    const update = vi.fn();
    const service = serviceWith({ update });

    await expect(service.update("x", { title: "X" })).rejects.toHaveProperty(
      "details.fields.id",
    );
    await expect(service.update(id, { title: "" })).rejects.toHaveProperty(
      "details.fields.title",
    );
    expect(update).not.toHaveBeenCalled();
  });
});

describe("adminProductService.remove", () => {
  it("remove o produto", async () => {
    const remove = vi.fn(async () => true);
    const service = serviceWith({ delete: remove });

    await service.remove(id);

    expect(remove).toHaveBeenCalledWith(id);
  });

  it("produto inexistente: 404 PRODUCT_NOT_FOUND", async () => {
    const service = serviceWith({ delete: async () => false });

    await expect(service.remove(id)).rejects.toHaveProperty(
      "code",
      "PRODUCT_NOT_FOUND",
    );
  });

  it("recusa id inválido com 400", async () => {
    const remove = vi.fn();
    const service = serviceWith({ delete: remove });

    await expect(service.remove("x")).rejects.toBeInstanceOf(ValidationError);
    expect(remove).not.toHaveBeenCalled();
  });
});
