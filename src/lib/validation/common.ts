import { z } from "zod";

/** Ids são UUID: validados antes de chegar ao banco (CLAUDE.md › Segurança). */
export const idSchema = z.uuid({ error: "Id inválido." });

/**
 * Só http(s): bloqueia `javascript:`, `data:` e afins. O banco tem o mesmo
 * CHECK (migration inicial).
 */
export const httpUrlSchema = z.url({
  protocol: /^https?$/,
  hostname: z.regexes.domain,
  error: "Use um endereço que comece com http:// ou https://.",
});
