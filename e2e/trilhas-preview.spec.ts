import { test, expect } from "@playwright/test";

/* Prévia das páginas por trilha da /cursos (2026-11-25). Trava o que a prévia
   promete: noindex, fora do sitemap, cursos da vitrine como texto, publicados
   antes dos em breve, e links para as outras trilhas. */

test("a prévia de trilha mostra os cursos e não é indexada", async ({ page }) => {
  await page.goto("/preview/cursos/ia-dados-e-tecnologia");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cursos de IA, Dados e Tecnologia");
  const lista = page.getByRole("region", { name: "Os cursos da trilha" });
  await expect(lista.getByRole("heading", { level: 3 })).toHaveCount(17);
  await expect(lista.getByRole("heading", { level: 3 }).first()).toHaveText("Fundamentos de IA para Negócios");
  await expect(lista.getByRole("listitem").first()).toContainText("Prof. Vinícius Ferreira");
  await expect(lista.getByRole("listitem").last()).toContainText("Em breve");
  await expect(page.getByRole("link", { name: "Assinar por R$ 49,90/mês" })).toHaveAttribute("href", "/cursos#assinar");
  await expect(page.getByRole("region", { name: "Outras trilhas na mesma assinatura" }).getByRole("link")).toHaveCount(5);
  await expect(page.locator("dt", { hasText: "Quem emite o certificado?" })).toBeVisible();
});

test("as seis trilhas respondem, trilha inexistente é 404 e nenhuma entra no sitemap", async ({ page, request }) => {
  for (const slug of [
    "ia-dados-e-tecnologia",
    "estrategia-inovacao-e-projetos",
    "comunicacao-e-comportamento",
    "negociacao-e-relacionamento",
    "lideranca-e-gestao",
    "compras-vendas-e-supply",
  ]) {
    expect((await request.get(`/preview/cursos/${slug}`)).status(), slug).toBe(200);
  }
  expect((await request.get("/preview/cursos/nao-existe")).status()).toBe(404);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/preview/");
  await page.goto("/cursos");
  await expect(page.locator('a[href^="/preview/"]')).toHaveCount(0);
});
