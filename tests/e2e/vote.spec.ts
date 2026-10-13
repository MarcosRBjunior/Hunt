import { clerk } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

import { E2E_USERS } from "./support/users";

test("TC-19: visitante clica no voto, faz login e vota", async ({ page }) => {
  await page.goto("/");
  const list = page.getByRole("list", { name: "Produtos" });

  // Visitante: o clique leva para o login, que volta para a home depois.
  // O Orbit tem 29 votos no seed da demo.
  await list.getByRole("button", { name: "Votar em Orbit (29 votos)" }).click();
  await expect(page).toHaveURL(/\/sign-in\?/);
  const redirectUrl = new URL(page.url()).searchParams.get("redirect_url");
  expect(redirectUrl).toBe("/");

  await clerk.signIn({ page, emailAddress: E2E_USERS.user.email });
  await page.goto(redirectUrl!);

  const vote = list.getByRole("button", { name: /^Votar em Orbit / });
  await expect(vote).toHaveAttribute("aria-pressed", "false");

  const response = page.waitForResponse(
    (res) => res.url().endsWith("/vote") && res.request().method() === "POST",
  );
  await vote.click();
  expect((await response).status()).toBe(201);

  await expect(vote).toHaveAttribute("aria-pressed", "true");
  await expect(vote).toHaveAccessibleName("Votar em Orbit (30 votos)");

  // O voto ficou gravado: depois de recarregar, continua lá.
  await page.reload();
  await expect(vote).toHaveAttribute("aria-pressed", "true");
  await expect(vote).toHaveAccessibleName("Votar em Orbit (30 votos)");
});
