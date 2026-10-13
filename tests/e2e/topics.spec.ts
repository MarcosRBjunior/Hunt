import { expect, test } from "@playwright/test";

// Topics dos produtos lançados da demo: SaaS = Layer (202), Sunnie (102) e
// Orbit (29). Milo AI (298) é IA e Produtividade.

test("TC-13: visitante filtra a home por topic e tira o filtro", async ({
  page,
}) => {
  await page.goto("/");
  const bar = page.getByRole("region", { name: "Trending topics" });
  const titles = page
    .getByRole("list", { name: "Produtos" })
    .getByRole("heading", { level: 3 });
  const sidebar = page.getByRole("complementary", {
    name: "Escolhas da equipe",
  });

  await bar.getByRole("link", { name: "SaaS", exact: true }).click();

  await expect(page).toHaveURL(/\/\?topic=saas$/);
  await expect(
    bar.getByRole("link", { name: "SaaS (remover filtro)" }),
  ).toHaveAttribute("aria-current", "true");
  await expect(titles).toHaveText([/^Layer/, /^Sunnie/, /^Orbit/]);
  // A lateral não filtra (regra 10): o Milo AI continua nos revisados.
  await expect(sidebar.getByText("Milo AI")).toBeVisible();

  await bar.getByRole("link", { name: "SaaS (remover filtro)" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(titles.first()).toHaveText(/^Milo AI/);
  await expect(bar.locator("[aria-current]")).toHaveCount(0);
});

test("TC-14: topic inexistente mostra o aviso na coluna principal", async ({
  page,
}) => {
  await page.goto("/?topic=inexistente");

  await expect(page.getByText("Categoria não encontrada")).toBeVisible();
  await expect(page.getByRole("list", { name: "Produtos" })).toHaveCount(0);

  await page.getByRole("link", { name: "Limpar filtro" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("list", { name: "Produtos" })).toBeVisible();
});

test("Categorias mostra a contagem e leva ao filtro da home", async ({
  page,
}) => {
  await page.goto("/categorias");
  const saas = page
    .getByRole("list", { name: "Categorias" })
    .getByRole("link", { name: /^SaaS/ });

  await expect(saas).toContainText("3 produtos");
  await saas.click();

  await expect(page).toHaveURL(/\/\?topic=saas$/);
  await expect(
    page.getByRole("list", { name: "Produtos" }).getByRole("heading", {
      level: 3,
    }),
  ).toHaveText([/^Layer/, /^Sunnie/, /^Orbit/]);
});
