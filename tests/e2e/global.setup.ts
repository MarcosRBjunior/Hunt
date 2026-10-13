import { clerkSetup } from "@clerk/testing/playwright";

import { resetE2eDatabase } from "./support/database";
import { ensureE2eUsers } from "./support/users";

/**
 * Roda uma vez antes dos testes: banco limpo com a demo, usuários de teste no
 * Clerk e o token que deixa o navegador automatizado passar pela proteção
 * contra bots do Clerk.
 */
export default async function globalSetup() {
  await resetE2eDatabase();
  await ensureE2eUsers();
  // As variáveis já vieram do playwright.config.ts (via @next/env).
  await clerkSetup({ dotenv: false });
}
