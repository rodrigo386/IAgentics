import { test, expect } from "@playwright/test";

/* A versão em inglês (2026-11-06): as páginas institucionais em /en, com
   hreflang dos dois lados e o seletor de idioma no menu. */
const PARES = [
  ["/", "/en"],
  ["/nexo", "/en/nexo"],
  ["/spend-lab", "/en/spend-lab"],
  ["/academy", "/en/academy"],
  ["/privacidade", "/en/privacy"],
] as const;

test("cada página em inglês abre em inglês, declara o idioma e aponta a versão em português", async ({ page }) => {
  for (const [pt, en] of PARES) {
    const resposta = await page.goto(en);
    expect(resposta?.status(), en).toBe(200);
    await expect(page.locator('div[lang="en"] main#conteudo')).toBeVisible();
    await expect(page.locator('link[rel="alternate"][hreflang="pt-BR"]')).toHaveAttribute("href", new RegExp(`${pt === "/" ? "/?" : pt}$`));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${en}$`));
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Ler esta página em português" })).toHaveAttribute("href", pt);
    await expect(page.locator("main")).not.toContainText("Vamos conversar");
  }
});

test("o seletor leva da página em português à mesma página em inglês, e a sem versão leva à home em inglês", async ({ page }) => {
  await page.goto("/nexo");
  await page.getByRole("link", { name: "Read this page in English" }).click();
  await expect(page).toHaveURL(/\/en\/nexo$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/cursos");
  await expect(page.getByRole("link", { name: "Read this page in English" })).toHaveAttribute("href", "/en");
});

test("o sitemap traz as páginas em inglês com hreflang", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const [, en] of PARES) expect(xml).toContain(`/${en.replace(/^\//, "")}</loc>`);
  expect(xml).toContain('hreflang="en"');
});
