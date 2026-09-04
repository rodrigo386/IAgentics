import { test, expect } from "@playwright/test";

/* Prévia da home (Fase 2 do alinhamento ao pitch). Primeiro que ela não vaza;
   depois que a home oficial não mudou; só então o conteúdo. */

test("a prévia da home existe, não é indexável e não está no sitemap", async ({ page, request }) => {
  await page.goto("/preview/home");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/preview");
});

test("a home oficial continua intacta — sem 'O problema' e com o cartão antigo do Nexo", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#problema")).toHaveCount(0);
  await expect(page.locator(".orq-pulse")).toHaveCount(0);
  await expect(page.getByText("Agentes de IA para Compras", { exact: true })).toBeVisible();
});

test("a hero da prévia usa o grafo do orquestrador e mantém a manchete do pitch", async ({ page }) => {
  await page.goto("/preview/home");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Compras e Gestão de Gastos");
  await expect(page.locator("#topo .orq-pulse")).toHaveCount(9);
  // O subtexto não fala mais só de "suprimentos".
  await expect(page.locator("#topo")).not.toContainText("suprimentos");
  await expect(page.locator("#topo")).toContainText("Nove módulos");
  // O link do produto sob o grafo continua existindo, como na home oficial.
  await expect(page.locator('#topo a[href="/nexo"]')).toHaveCount(1);
});

test("'O problema' traz os dois números do pitch com a fonte visível", async ({ page }) => {
  await page.goto("/preview/home");
  const sec = page.locator("#problema");
  await expect(sec.getByText("57%", { exact: true })).toBeVisible();
  await expect(sec.getByText("70%", { exact: true })).toBeVisible();
  /* Número sem fonte na tela é o que a regra de copy proíbe: as duas
     referências McKinsey precisam estar renderizadas, não só no código. */
  await expect(sec.getByText(/McKinsey Global Institute/)).toBeVisible();
  await expect(sec.getByText(/Procurement insights/)).toBeVisible();
  await expect(sec.getByRole("listitem")).toHaveCount(6);
});

test("o cartão do Nexo vira orquestrador com os nove módulos em chips", async ({ page }) => {
  await page.goto("/preview/home");
  const card = page.locator('#solucoes a[href="/nexo"]');
  await expect(card.getByText("Orquestrador de gestão de gastos")).toBeVisible();
  await expect(card.getByRole("listitem")).toHaveCount(9);
  // Os chips antigos dos agentes (RC, RFP) não aparecem mais.
  await expect(card.getByText("RFP", { exact: true })).toHaveCount(0);
  // Os outros dois cartões não mudaram.
  await expect(page.locator('#solucoes a[href="/academy"]').getByRole("listitem")).toHaveCount(3);
});
