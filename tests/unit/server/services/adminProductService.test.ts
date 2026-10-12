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
});

describe("adminProductService.get", () => {
  it("devolve o produto de qualquer status como ProductDTO", async () => {
    const findById = vi.fn(async () =>
      buildProduct({ id, title: "Em breve", status: "UPCOMING" }),
    );
    const service = serviceWith({ findById });

    const product = await service.get(id);

    expect(findById).toHaveBeenCalledWith(id);
    expect(product).toMatchObject({
      id,
      title: "Em breve",
      status: "UPCOMING",
    });
  });

  it("responde 404 PRODUCT_NOT_FOUND quando o produto não existe", async () => {
    const service = serviceWith({ findById: async () => null });

    const error = await service.get(id).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toHaveProperty("code", "PRODUCT_NOT_FOUND");
  });

  it("recusa id que não é UUID antes de chegar ao banco", async () => {
    const findById = vi.fn();
    const service = serviceWith({ findById });

    await expect(service.get("abc")).rejects.toBeInstanceOf(ValidationError);
    expect(findById).not.toHaveBeenCalled();
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
