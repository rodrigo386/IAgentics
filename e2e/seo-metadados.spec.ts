import { test, expect, type APIRequestContext } from "@playwright/test";

/* Título, descrição e H1 das páginas indexadas.
 *
 * Nasceu de um relatório do Bing Webmaster (2026-09-14) que marcou três
 * títulos e duas descrições como curtos demais. O que estes testes travam não
 * é o checklist: é que o texto que a pessoa lê NO RESULTADO DA BUSCA continue
 * dizendo o que a página faz. Título curto não é penalidade — é uma linha que
 * não convence ninguém a clicar. */

const PAGINAS = [
  "/",
  "/nexo",
  "/academy",
  "/cursos",
  "/spend-lab",
  "/diagnose-compras",
  "/reforma-tributaria-compras",
  "/consulta-ncm-cclasstrib",
  "/bolsas",
  "/artigos",
  "/privacidade",
  "/artigos/prompts-para-compras",
];

/* Os limiares do Bing, com folga: ele marcou títulos de 19 caracteres e
   descrições de 104. Abaixo disso o buscador inventa um trecho da página no
   lugar da descrição. */
const TITULO_MINIMO = 30;
const DESCRICAO_MINIMA = 110;
const DESCRICAO_MAXIMA = 165;

async function cabeca(request: APIRequestContext, rota: string) {
  const html = await (await request.get(rota)).text();
  const titulo = html.match(/<title>(.*?)<\/title>/s)?.[1] ?? "";
  const descricao = html.match(/<meta name="description" content="(.*?)"/s)?.[1] ?? "";
  return { titulo: decodeURIComponent(titulo), descricao };
}

test("toda página indexada tem título e descrição com tamanho útil", async ({ request }) => {
  for (const rota of PAGINAS) {
    const { titulo, descricao } = await cabeca(request, rota);
    expect(titulo.length, `${rota}: título "${titulo}"`).toBeGreaterThanOrEqual(TITULO_MINIMO);
    expect(descricao.length, `${rota}: descrição curta`).toBeGreaterThanOrEqual(DESCRICAO_MINIMA);
    /* O teto vale para as páginas do site, não para artigo: a descrição do
       artigo é do autor, no frontmatter, e algumas passam de 180. O buscador
       corta o excedente e a mensagem cabe nos primeiros ~155 — cortar texto
       do autor para agradar um contador seria trocar a coisa pela medida. */
    if (!rota.startsWith("/artigos/")) {
      expect(descricao.length, `${rota}: descrição longa demais, será cortada`).toBeLessThanOrEqual(DESCRICAO_MAXIMA);
    }
  }
});

/* Auditoria de SEO de 2026-11-24: "IAgentics · tagline" tinha 67 caracteres
   e o Google corta perto de 60. */
test("o título da home cabe no resultado da busca, nos dois idiomas", async ({ request }) => {
  for (const rota of ["/", "/en"]) {
    const { titulo } = await cabeca(request, rota);
    expect(titulo.length, `${rota}: "${titulo}"`).toBeLessThanOrEqual(60);
    expect(titulo).toMatch(/^IAgentics · /);
  }
});

test("o sitemap só leva url, lastmod e idiomas (o Google ignora priority e changefreq)", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("<lastmod>");
  expect(xml).not.toContain("<priority>");
  expect(xml).not.toContain("<changefreq>");
});

async function blocosJsonLd(request: APIRequestContext, rota: string) {
  const html = await (await request.get(rota)).text();
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
}

test("home com Organization e WebSite; páginas do menu com trilha; /cursos com a oferta mensal", async ({ request }) => {
  const tipos = async (rota: string) => (await blocosJsonLd(request, rota)).map((b) => b["@type"]);
  expect(await tipos("/")).toEqual(expect.arrayContaining(["Organization", "WebSite"]));
  for (const rota of ["/nexo", "/academy", "/spend-lab", "/cursos", "/en/nexo"]) {
    const trilha = (await blocosJsonLd(request, rota)).find((b) => b["@type"] === "BreadcrumbList");
    expect(trilha?.itemListElement, rota).toHaveLength(2);
    expect(trilha.itemListElement[1].item.endsWith(rota)).toBe(true);
  }
  expect(await tipos("/nexo")).toContain("Service");
  const produto = (await blocosJsonLd(request, "/cursos")).find((b) => b["@type"] === "Product");
  expect(produto.offers.price).toBe("49.90");
  expect(produto.offers.priceCurrency).toBe("BRL");
});

test("toda página indexada tem exatamente um H1", async ({ page }) => {
  for (const rota of PAGINAS) {
    await page.goto(rota);
    await expect(page.locator("h1"), rota).toHaveCount(1);
  }
});

/**
 * A manchete é montada em <span class="block">, um por linha. Sem um nó de
 * espaço entre eles o textContent cola as palavras: o leitor de tela lia
 * "paraCompras" e o buscador indexava isso. Estava no ar e nenhum verificador
 * de SEO viu — nem o do Bing, que olha a existência do H1, não o que ele diz.
 */
test("a manchete da home e do Nexo é uma frase, não palavras coladas", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("para Compras");

  await page.goto("/nexo");
  await expect(page.locator("h1")).toContainText("orquestra toda");

  for (const rota of ["/", "/nexo"]) {
    await page.goto(rota);
    const texto = (await page.locator("h1").textContent()) ?? "";
    /* minúscula colada em maiúscula é o rastro do defeito: "paraCompras". */
    expect(texto, `${rota}: palavras coladas em "${texto}"`).not.toMatch(/\p{Ll}\p{Lu}/u);
  }
});
