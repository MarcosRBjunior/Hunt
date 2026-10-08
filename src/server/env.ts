import { z } from "zod";

/** `postgres://` ou `postgresql://`. Vazio no `.env` conta como ausente. */
const postgresUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.url({ protocol: /^postgres(ql)?$/ }).optional(),
);

/**
 * Variáveis de ambiente validadas na inicialização. O schema cresce por fase:
 * banco entrou na Fase 4 e o Clerk entra na Fase 6 (ver `.env.example`).
 */
const envSchema = z
  .object({
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
    DATABASE_URL: postgresUrl,
    // Só com pooler: conexão direta usada pelo CLI do Prisma.
    DIRECT_URL: postgresUrl,
  })
  .refine(
    (env) => env.PRODUCT_SOURCE !== "prisma" || env.DATABASE_URL !== undefined,
    {
      path: ["DATABASE_URL"],
      message: "obrigatória com PRODUCT_SOURCE=prisma",
    },
  );

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
