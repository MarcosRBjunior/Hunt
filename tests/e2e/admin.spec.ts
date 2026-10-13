import { clerk } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

import { E2E_USERS } from "./support/users";

test("TC-20: admin cadastra produto e ele aparece na home com 0 votos", async ({
  page,
}) => {
  const title = "Produto E2E";

  await page.goto("/");
  await clerk.signIn({ page, emailAddress: E2E_USERS.admin.email });

  await page.goto("/admin/produtos/novo");
  await page.getByLabel("Nome", { exact: true }).fill(title);
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Cadastrado pelo teste E2E.");
  await page
    .getByLabel("Endereço do site", { exact: true })
    .fill("https://example.com");
  await page.getByRole("button", { name: "Cadastrar produto" }).click();

  // Depois de salvar, volta para a tabela do admin, já com o produto.
  await expect(page).toHaveURL("/admin/produtos");
  await expect(
    page.getByRole("row", { name: new RegExp(title) }),
  ).toBeVisible();

  await page.goto("/");
  const list = page.getByRole("list", { name: "Produtos" });
  await expect(list.getByRole("heading", { name: title })).toBeVisible();
  await expect(
    list.getByRole("button", { name: `Votar em ${title} (0 votos)` }),
  ).toBeVisible();
});
