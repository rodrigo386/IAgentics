import { expect, test } from "@playwright/test";

/** Consulta de NCM (2026-11-19): busca no servidor, por GET, e leva a redução à calculadora. */
const ROTA = "/consulta-ncm-cclasstrib";

test("busca por nome, abre o NCM e mostra a redução com a condição do anexo", async ({ page }) => {
  await page.goto(ROTA);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/consulta-ncm-cclasstrib$/);
  await page.getByLabel("NCM ou nome do produto").fill("sabões toucador");
  await page.getByRole("button", { name: "Consultar" }).click();
  await expect(page).toHaveURL(/q=sab/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.getByRole("link", { name: /3401\.11\.90/ }).click();
  await expect(page.getByText("cClassTrib 200035")).toBeVisible();
  await expect(page.getByText("60%").first()).toBeVisible();
  await expect(page.getByText("Condição (anexo da LC 214) · Anexo VIII")).toBeVisible();
  await page.getByRole("link", { name: "Comparar cotações com 60% de redução" }).click();
  await expect(page).toHaveURL(/\/reforma-tributaria-compras\?reducao=60/);
  await expect(page.getByLabel("Redução de alíquota do item")).toHaveValue("60");
});

test("o pacote Reforma Tributária para Compras aparece nas duas, com a página atual marcada", async ({ page }) => {
  for (const [rota, atual] of [["/reforma-tributaria-compras", "Calculadora de custo líquido"], ["/consulta-ncm-cclasstrib", "Consulta de NCM"]]) {
    await page.goto(rota);
    const pacote = page.getByRole("navigation", { name: /Ferramentas da IAgentics para Compras/ });
    await expect(pacote.getByRole("link")).toHaveCount(3);
    await expect(pacote.locator('[aria-current="page"]')).toContainText(atual);
  }
});

test("as duas páginas apontam uma para a outra", async ({ page }) => {
  await page.goto("/reforma-tributaria-compras");
  await page.getByRole("link", { name: "Consultar o NCM" }).click();
  await expect(page).toHaveURL(/\/consulta-ncm-cclasstrib$/);
  await page.getByRole("link", { name: /Compare as cotações na calculadora/ }).click();
  await expect(page).toHaveURL(/\/reforma-tributaria-compras$/);
});

test("NCM sem tratamento especial cai na tributação integral; cerveja tem Imposto Seletivo", async ({ page }) => {
  await page.goto(`${ROTA}?ncm=84713012`);
  await expect(page.getByText(/cClassTrib 000001/)).toBeVisible();
  await expect(page.getByText("Este NCM não está na lista do Imposto Seletivo.")).toBeVisible();
  await page.goto(`${ROTA}?ncm=22030000`);
  await expect(page.getByText(/está na lista do Imposto Seletivo/)).toBeVisible();
  await page.goto(`${ROTA}?ncm=12345678`);
  await expect(page.getByText(/não existe na tabela vigente/)).toBeVisible();
});
