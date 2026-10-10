import { z } from "zod";

import { TOPIC_SLUGS } from "@/lib/topics";

import { httpUrlSchema } from "./common";

export const PRODUCT_TITLE_MAX = 80;
export const PRODUCT_DESCRIPTION_MAX = 500;

/** Texto obrigatório: espaços das pontas não contam (o banco tem CHECK de não vazio). */
function requiredText(label: string, max: number) {
  return z
    .string({ error: `Informe ${label}.` })
    .trim()
    .min(1, `Informe ${label}.`)
    .max(max, `Use no máximo ${max} caracteres.`);
}

const productFields = {
  title: requiredText("o nome", PRODUCT_TITLE_MAX),
  description: requiredText("a descrição", PRODUCT_DESCRIPTION_MAX),
  url: httpUrlSchema,
  logoUrl: httpUrlSchema.nullable(),
  status: z.enum(["LAUNCHED", "UPCOMING"], { error: "Status inválido." }),
  topicSlugs: z
    .array(z.enum(TOPIC_SLUGS, { error: "Topic inexistente." }))
    .refine((slugs) => new Set(slugs).size === slugs.length, "Topic repetido."),
};

/**
 * Body do admin ao criar um produto. Campos fora do schema (como `upvotes` e
 * `visits`) são descartados (regra 7).
 */
export const createProductSchema = z.object({
  ...productFields,
  logoUrl: productFields.logoUrl.default(null),
  status: productFields.status.default("LAUNCHED"),
  topicSlugs: productFields.topicSlugs.default([]),
});

/** PATCH: tudo opcional; `topicSlugs` substitui a lista inteira. */
export const updateProductSchema = z.object(productFields).partial();

export type CreateProductInput = z.output<typeof createProductSchema>;
export type UpdateProductInput = z.output<typeof updateProductSchema>;
