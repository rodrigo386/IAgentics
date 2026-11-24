import { expect, test, type Page } from "@playwright/test";

/* Sorteio no Case 2026 (2026-11-23). O e2e sobe com SORTEIO_RELOGIO dentro do
   prazo e RESEND_API_KEY vazio (playwright.config.ts): nenhum e-mail sai. */

async function preencher(page: Page, email: string) {
  await page.getByLabel("Nome completo").fill("Ana Teste Souza");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("WhatsApp, com DDD").fill("(11) 98888-7777");
  await page.getByLabel("Área de atuação").selectOption("Compras e Suprimentos");
  await page.getByRole("checkbox", { name: /Estou seguindo a IAgentics/ }).check();
  await page.getByRole("checkbox", { name: /li e aceito o/ }).check();
}

test("a página do QR code mostra o prêmio, o formulário e as redes, e fica fora do Google", async ({ page }) => {
  await page.goto("/sorteio");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Concorra a um porta-lata moletom IAgentics.");
  await expect(page.getByRole("img", { name: /Porta-lata azul em forma de moletom/ })).toBeVisible();
  await expect(page.getByText("Imagem ilustrativa", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "IAgentics no LinkedIn" })).toHaveAttribute("href", /linkedin\.com\/company\/iagentics/);
  await expect(page.getByRole("link", { name: "@iagentics no Instagram" })).toHaveAttribute("href", /instagram\.com\/iagentics/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("o cadastro dá o número da sorte, leva à plataforma e não repete número para o mesmo e-mail", async ({ page }) => {
  const email = `sorteio-${Date.now()}@exemplo-teste.com`;
  await page.goto("/sorteio");
  await preencher(page, email);
  await page.getByRole("button", { name: "Quero meu número da sorte" }).click();
  const numero = page.locator("[data-numero]");
  await expect(numero).toHaveText(/^\d{4,}$/);
  await expect(page.getByRole("link", { name: "Conhecer a plataforma" })).toHaveAttribute("href", "/cursos");
  await expect(page.getByRole("link", { name: "IAgentics no LinkedIn" })).toBeVisible();

  await page.goto("/sorteio");
  await preencher(page, email);
  await page.getByRole("button", { name: "Quero meu número da sorte" }).click();
  await expect(page.getByText("Este e-mail já está participando do sorteio.")).toBeVisible();
  await expect(page.locator("[data-numero]")).toHaveCount(0);
});

test("o servidor recusa cadastro sem área e o regulamento abre", async ({ page, request }) => {
  const r = await request.post("/api/sorteio", {
    data: { nome: "Ana Souza", email: `x-${Date.now()}@exemplo-teste.com`, whatsapp: "11988887777", area: "", seguindo: true, regulamento: true },
  });
  expect(r.status()).toBe(422);
  expect((await r.json()).error).toBe("area");
  await page.goto("/sorteio/regulamento");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Regulamento do sorteio no Case 2026");
  await expect(page.getByText(/até as 18h de 26 de novembro de 2026/)).toBeVisible();
});

test("o painel e o CSV do sorteio ficam atrás da senha", async ({ request }) => {
  expect((await request.get("/admin/sorteio")).status()).toBe(401);
  expect((await request.get("/admin/sorteio.csv")).status()).toBe(401);
});
