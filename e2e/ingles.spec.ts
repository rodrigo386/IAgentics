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
    /* O documento inteiro em inglês (2026-11-24): antes o <html> dizia pt-BR. */
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("main#conteudo")).toBeVisible();
    await expect(page.locator('link[rel="alternate"][hreflang="pt-BR"]')).toHaveAttribute("href", new RegExp(`${pt === "/" ? "/?" : pt}$`));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${en}$`));
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Ler esta página em português" })).toHaveAttribute("href", pt);
    await expect(page.locator("main")).not.toContainText("Vamos conversar");
  }
});

test("as páginas em português seguem com o documento em pt-BR, e URL inexistente cai no 404 da marca", async ({ page }) => {
  for (const pt of ["/", "/nexo", "/cursos", "/artigos"]) {
    await page.goto(pt);
    await expect(page.locator("html"), pt).toHaveAttribute("lang", "pt-BR");
  }
  const resposta = await page.goto("/nao-existe-esta-pagina");
  expect(resposta?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Esta página não existe.");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
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
