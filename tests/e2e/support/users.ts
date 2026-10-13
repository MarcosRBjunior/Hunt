import { isDeepStrictEqual } from "node:util";

import { createClerkClient } from "@clerk/backend";

/**
 * Usuários de teste na instância de desenvolvimento do Clerk. O sufixo
 * `+clerk_test` marca o e-mail como de teste: o Clerk nunca envia mensagens
 * para ele. Os testes entram sem senha, com um token criado pela API do Clerk.
 */
export const E2E_USERS = {
  admin: {
    email: "e2e-admin+clerk_test@example.com",
    publicMetadata: { role: "admin" },
  },
  user: {
    email: "e2e-user+clerk_test@example.com",
    publicMetadata: {},
  },
} as const;

/**
 * Cria os usuários de teste que faltarem e acerta o papel de cada um (o admin
 * vem de `publicMetadata.role`, como no app). Rodar de novo não duplica nada.
 */
export async function ensureE2eUsers(): Promise<void> {
  const secretKey = process.env.CLERK_SECRET_KEY ?? "";
  // Só a instância de desenvolvimento: a chave de produção começa com sk_live_.
  if (!secretKey.startsWith("sk_test_")) {
    throw new Error(
      "Os testes E2E precisam da CLERK_SECRET_KEY da instância de desenvolvimento (sk_test_...)",
    );
  }

  const clerk = createClerkClient({ secretKey });

  for (const { email, publicMetadata } of Object.values(E2E_USERS)) {
    const { data } = await clerk.users.getUserList({ emailAddress: [email] });
    const existing = data[0];

    if (!existing) {
      await clerk.users.createUser({
        emailAddress: [email],
        skipPasswordRequirement: true,
        publicMetadata,
      });
    } else if (!isDeepStrictEqual(existing.publicMetadata, publicMetadata)) {
      await clerk.users.updateUser(existing.id, { publicMetadata });
    }
  }
}
