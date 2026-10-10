import { describe, expect, it } from "vitest";

import { idSchema } from "@/lib/validation/common";
import {
  createProductSchema,
  updateProductSchema,
} from "@/lib/validation/product";

const validBody = {
  title: "Layer",
  description: "A API visual que conecta suas ferramentas.",
  url: "https://layer.example.com",
};

function fieldErrors(result: { success: boolean; error?: unknown }) {
  expect(result.success).toBe(false);
  const issues = (result.error as { issues: { path: PropertyKey[] }[] }).issues;
  return issues.map((issue) => issue.path.join("."));
}

describe("createProductSchema", () => {
  it("aceita o body mínimo e completa logo, status e topics com os padrões", () => {
    expect(createProductSchema.parse(validBody)).toEqual({
      ...validBody,
      logoUrl: null,
      status: "LAUNCHED",
      topicSlugs: [],
    });
  });

  it("aceita todos os campos", () => {
    const body = {
      ...validBody,
      logoUrl: "http://cdn.example.com/layer.png",
      status: "UPCOMING",
      topicSlugs: ["saas", "tech"],
    };

    expect(createProductSchema.parse(body)).toEqual(body);
  });

  it("TC-12: recusa url javascript: apontando o campo url", () => {
    const result = createProductSchema.safeParse({
      ...validBody,
      url: "javascript:alert(1)",
    });

    expect(fieldErrors(result)).toEqual(["url"]);
  });

  it.each(["data:text/html,oi", "ftp://example.com", "example.com", ""])(
    "recusa url que não é http(s): %s",
    (url) => {
      expect(
        fieldErrors(createProductSchema.safeParse({ ...validBody, url })),
      ).toEqual(["url"]);
    },
  );

  it("recusa logoUrl javascript:", () => {
    const result = createProductSchema.safeParse({
      ...validBody,
      logoUrl: "javascript:alert(1)",
    });

    expect(fieldErrors(result)).toEqual(["logoUrl"]);
  });

  it("TC-11/TC-25: ignora upvotes e visits enviados no body", () => {
    const parsed = createProductSchema.parse({
      ...validBody,
      upvotes: 500,
      visits: 999,
    });

    expect(parsed).not.toHaveProperty("upvotes");
    expect(parsed).not.toHaveProperty("visits");
  });

  it("tira espaços das pontas do nome e da descrição", () => {
    const parsed = createProductSchema.parse({
      ...validBody,
      title: "  Layer  ",
      description: " Descrição. ",
    });

    expect(parsed.title).toBe("Layer");
    expect(parsed.description).toBe("Descrição.");
  });

  it.each([
    ["nome vazio", { title: "" }, "title"],
    ["nome só com espaços", { title: "   " }, "title"],
    ["nome com 81 caracteres", { title: "a".repeat(81) }, "title"],
    ["descrição vazia", { description: "" }, "description"],
    [
      "descrição com 501 caracteres",
      { description: "a".repeat(501) },
      "description",
    ],
    ["status desconhecido", { status: "DRAFT" }, "status"],
  ])("recusa %s", (_, override, field) => {
    expect(
      fieldErrors(createProductSchema.safeParse({ ...validBody, ...override })),
    ).toEqual([field]);
  });

  it("aceita os limites exatos: nome com 80 e descrição com 500 caracteres", () => {
    const result = createProductSchema.safeParse({
      ...validBody,
      title: "a".repeat(80),
      description: "a".repeat(500),
    });

    expect(result.success).toBe(true);
  });

  it.each([
    ["obrigatório faltando", { title: undefined }, "title"],
    ["url faltando", { url: undefined }, "url"],
  ])("recusa %s", (_, override, field) => {
    expect(
      fieldErrors(createProductSchema.safeParse({ ...validBody, ...override })),
    ).toEqual([field]);
  });

  it("recusa topic que não é um dos 5 do seed", () => {
    const result = createProductSchema.safeParse({
      ...validBody,
      topicSlugs: ["saas", "inexistente"],
    });

    expect(fieldErrors(result)).toEqual(["topicSlugs.1"]);
  });

  it("recusa topic repetido", () => {
    const result = createProductSchema.safeParse({
      ...validBody,
      topicSlugs: ["saas", "saas"],
    });

    expect(fieldErrors(result)).toEqual(["topicSlugs"]);
  });
});

describe("updateProductSchema", () => {
  it("aceita body vazio (nada muda)", () => {
    expect(updateProductSchema.parse({})).toEqual({});
  });

  it("devolve só os campos enviados, sem preencher padrões", () => {
    expect(updateProductSchema.parse({ status: "UPCOMING" })).toEqual({
      status: "UPCOMING",
    });
  });

  it("aceita logoUrl null (remove o logo) e lista de topics vazia", () => {
    expect(
      updateProductSchema.parse({ logoUrl: null, topicSlugs: [] }),
    ).toEqual({ logoUrl: null, topicSlugs: [] });
  });

  it("TC-25: ignora visits e upvotes no PATCH", () => {
    expect(updateProductSchema.parse({ visits: 999, upvotes: 1 })).toEqual({});
  });

  it("valida os campos enviados com as mesmas regras da criação", () => {
    expect(
      fieldErrors(
        updateProductSchema.safeParse({ url: "javascript:alert(1)" }),
      ),
    ).toEqual(["url"]);
    expect(fieldErrors(updateProductSchema.safeParse({ title: " " }))).toEqual([
      "title",
    ]);
  });
});

describe("idSchema", () => {
  it("aceita UUID", () => {
    expect(idSchema.parse("a59e45f4-7972-4bf3-ae41-0d6136c45f8c")).toBe(
      "a59e45f4-7972-4bf3-ae41-0d6136c45f8c",
    );
  });

  it.each([
    "123",
    "",
    "a59e45f4-7972-4bf3-ae41-0d6136c45f8",
    "'; DROP TABLE products; --",
  ])("recusa id que não é UUID: %s", (id) => {
    expect(idSchema.safeParse(id).success).toBe(false);
  });
});
