import { z } from "zod";

/**
 * Variáveis de ambiente validadas na inicialização. O schema cresce por fase:
 * banco entra na Fase 4 e Clerk na Fase 6 (ver `.env.example`).
 */
const envSchema = z.object({
  PRODUCT_SOURCE: z.enum(["mock", "prisma"]),
  LOG_LEVEL: z.enum([
    "fatal",
    "error",
    "warn",
    "info",
    "debug",
    "trace",
    "silent",
  ]),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    throw new Error(
      `Variáveis de ambiente inválidas:\n${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
}

export const env = parseEnv(process.env);
