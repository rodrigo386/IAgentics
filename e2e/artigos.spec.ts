import { test, expect } from "@playwright/test";

/**
 * A listagem de artigos e uma página de artigo.
 *
 * O que estas asserções protegem, além do óbvio: a ordem editorial (os cinco
 * primeiros artigos foram ao ar no MESMO dia, então sem o desempate por
 * `ordem` a sequência viria do sistema de arquivos) e o 404 de rascunho — o
 * portão que impede um texto em revisão de vazar por URL adivinhada.
 */

test("a listagem abre, está no menu e leva ao artigo", async ({ page }) => {
  await page.goto("/artigos");

  await expect(page.getByRole("heading", { name: "Artigos", level: 1 })).toBeVisible();

  // O link do menu entrou junto com a primeira publicação.
  await expect(page.getByRole("navigation").getByRole("link", { name: "Artigos" }).first()).toBeVisible();

  // O do ROI lidera: é o único com caso real, e todos têm a mesma data.
  const titulos = page.getByRole("heading", { level: 2 });
  await expect(titulos.first()).toContainText("ROI de IA em Compras");

  const primeiro = page.getByRole("link", { name: /ROI de IA em Compras/ });
  await primeiro.click();
  await expect(page).toHaveURL(/\/artigos\/roi-de-ia-em-compras-o-que-responder-ao-cfo$/);
});

test("o artigo traz título, autoria, corpo e volta para a listagem", async ({ page }) => {
  await page.goto("/artigos/roi-de-ia-em-compras-o-que-responder-ao-cfo");

  await expect(
    page.getByRole("heading", { name: /ROI de IA em Compras/, level: 1 }),
  ).toBeVisible();

  // Trilho de metadados: autoria e data por extenso, sem voltar um dia no fuso.
  await expect(page.getByText("Rodrigo Costa — IAgentics")).toBeVisible();
  await expect(page.getByText("20 de agosto de 2026")).toBeVisible();

  // Corpo renderizado a partir do markdown: citação e tabela existem de fato.
  await expect(page.locator(".artigo-corpo blockquote").first()).toBeVisible();
  await expect(page.locator(".artigo-corpo .artigo-tabela table")).toBeVisible();

  // Tabela larga NUNCA empurra a página no horizontal (DESIGN.md §9).
  await page.setViewportSize({ width: 390, height: 844 });
  const estouraNaHorizontal = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(estouraNaHorizontal).toBe(false);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("link", { name: "Todos os artigos" }).click();
  await expect(page).toHaveURL(/\/artigos$/);
});

test("slug inexistente dá 404", async ({ page }) => {
  const resposta = await page.goto("/artigos/artigo-que-nunca-existiu");
  expect(resposta?.status()).toBe(404);
});

test("o artigo declara canonical próprio e og:type de artigo", async ({ page }) => {
  await page.goto("/artigos/tail-spend-guia-em-portugues");

  // A armadilha de metadata herdada do layout: sem declaração própria, toda
  // rota anuncia a home como seu endereço.
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical).toBe("https://iagentics.com.br/artigos/tail-spend-guia-em-portugues");

  const ogUrl = await page.locator('meta[property="og:url"]').getAttribute("content");
  expect(ogUrl).toBe("https://iagentics.com.br/artigos/tail-spend-guia-em-portugues");

  // `article`, não `website`: é o que faz o LinkedIn montar cartão de
  // publicação em vez de cartão de site.
  const ogType = await page.locator('meta[property="og:type"]').getAttribute("content");
  expect(ogType).toBe("article");

  // JSON-LD de Article com a casa do texto declarada — o nosso lado da
  // conversa sobre qual versão é a original, já que o LinkedIn não suporta
  // canonical na republicação.
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  const dados = JSON.parse(jsonLd ?? "{}");
  expect(dados["@type"]).toBe("Article");
  expect(dados.mainEntityOfPage["@id"]).toBe(
    "https://iagentics.com.br/artigos/tail-spend-guia-em-portugues",
  );
});
