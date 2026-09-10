import { test, expect, type Page } from "@playwright/test";

/* A medição de visitas. O que estes testes protegem é o que a medição promete:
   que ela não conta quem marcou "não conte", que a origem viaja uma vez por
   visita (e não uma por página lida), e que o referrer sai do navegador sem
   caminho nem querystring. */

const CHAVE = "iagentics:nao-contar";

/** Conta os POSTs do beacon. Serve para "saiu ou não saiu" — não para ler o
 *  corpo, que num sendBeacon o Playwright não expõe (medido: `postData()`
 *  volta null e `postDataBuffer()` volta undefined). */
function contarBeacons(page: Page) {
  const urls: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/estatisticas") && r.method() === "POST") urls.push(r.url());
  });
  return urls;
}

/**
 * Para LER o corpo, tiramos o sendBeacon do navegador e deixamos o componente
 * cair no `fetch`, que é o caminho que ele já tem para navegador sem suporte.
 * O corpo é montado ANTES dessa bifurcação, então é o mesmo JSON nos dois
 * ramos — o que muda é só quem o entrega.
 */
async function lerCorpos(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "sendBeacon", { value: undefined, configurable: true });
  });
  const corpos: Record<string, unknown>[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/estatisticas") && r.method() === "POST") {
      const bruto = r.postData();
      if (bruto) corpos.push(JSON.parse(bruto));
    }
  });
  return corpos;
}

test("sem marca, a visita é contada e leva a origem", async ({ page }) => {
  const corpos = await lerCorpos(page);
  await page.goto("/");
  await expect.poll(() => corpos.length, { timeout: 5000 }).toBeGreaterThan(0);

  expect(corpos[0].rota).toBe("/");
  /* O campo PRESENTE é o que marca a chegada — vazio aqui, porque o teste abre
     a página direto, sem referrer, e vazio o servidor lê como "direto". */
  expect(corpos[0]).toHaveProperty("origem");
});

test("com a marca, nada sai do navegador", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((chave) => localStorage.setItem(chave, "1"), CHAVE);

  const urls = contarBeacons(page);
  await page.goto("/nexo");
  await page.waitForTimeout(1200);
  await page.goto("/academy");
  await page.waitForTimeout(1200);

  expect(urls, "beacon disparou mesmo com a marca ligada").toHaveLength(0);
});

/* A asserção que dá sentido à tabela `entradas`: document.referrer NÃO muda em
   navegação de cliente do App Router. Mandá-lo em toda troca de rota contaria
   a mesma chegada uma vez por página lida, e "quantos vieram do Google" viraria
   um número inflado pela profundidade da leitura. */
test("a origem viaja uma vez por documento, não por página", async ({ page }) => {
  const corpos = await lerCorpos(page);
  await page.goto("/");
  await expect.poll(() => corpos.length, { timeout: 5000 }).toBeGreaterThan(0);

  await page.getByRole("navigation").getByRole("link", { name: "Nexo", exact: true }).first().click();
  await expect(page).toHaveURL(/\/nexo$/);
  await expect.poll(() => corpos.length, { timeout: 5000 }).toBeGreaterThan(1);

  expect(corpos[0]).toHaveProperty("origem");
  expect(corpos[1].rota).toBe("/nexo");
  expect(corpos[1]).not.toHaveProperty("origem");
});

/* O referrer sai do navegador reduzido ao hostname. Caminho e querystring são
   onde mora o que poderia identificar alguém — termo de busca, id de campanha,
   token colado num link — e nada disso precisa sair para responder "de onde
   vieram". */
test("o referrer sai como hostname, sem caminho nem querystring", async ({ page }) => {
  const corpos = await lerCorpos(page);
  /* Uma página do próprio site com querystring, e dali um link para outra: o
     referrer do segundo documento é a URL inteira da primeira. */
  await page.goto("/spend-lab?utm_source=teste&termo=segredo");
  await expect.poll(() => corpos.length, { timeout: 5000 }).toBeGreaterThan(0);
  corpos.length = 0;

  await page.evaluate(() => window.location.assign("/"));
  await expect.poll(() => corpos.length, { timeout: 5000 }).toBeGreaterThan(0);

  const origem = corpos[0].origem as string;
  expect(origem).not.toContain("?");
  expect(origem).not.toContain("segredo");
  expect(origem).not.toContain("/spend-lab");
  expect(origem).toMatch(/^[a-z0-9.:-]*$/);
});
