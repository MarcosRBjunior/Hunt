import { z } from "zod";

export const REVIEW_SUMMARY_MAX = 280;

/**
 * Revisão do admin (regra 9): nota inteira de 1 a 5 e resumo opcional. Resumo
 * vazio (ou só com espaços) vira `null`.
 */
export const reviewSchema = z.object({
  rating: z
    .int({ error: "Escolha uma nota de 1 a 5." })
    .min(1, "Escolha uma nota de 1 a 5.")
    .max(5, "Escolha uma nota de 1 a 5."),
  summary: z
    .string({ error: "Resumo inválido." })
    .trim()
    .max(REVIEW_SUMMARY_MAX, `Use no máximo ${REVIEW_SUMMARY_MAX} caracteres.`)
    .nullable()
    .default(null)
    .transform((summary) => summary || null),
});

export type ReviewInput = z.output<typeof reviewSchema>;
