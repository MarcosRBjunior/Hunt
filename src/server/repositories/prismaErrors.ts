import { Prisma } from "@/generated/prisma/client";

/**
 * Erros do Prisma que viram regra de negócio: P2002 (UNIQUE violado),
 * P2003 (chave estrangeira inexistente) e P2025 (registro não encontrado).
 */
export function isPrismaError(
  error: unknown,
  code: "P2002" | "P2003" | "P2025",
): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}
