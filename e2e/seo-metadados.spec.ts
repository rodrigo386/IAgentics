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
