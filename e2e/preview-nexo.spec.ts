import { test, expect } from "@playwright/test";

/* Prévia da /nexo (Fase 1 do alinhamento ao pitch). O que este spec garante
   é, antes de tudo, que a prévia NÃO VAZA: é uma página em construção que o
   Rodrigo ainda vai aprovar, e ela não pode aparecer no Google nem no sitemap
   enquanto isso. Só depois vem o conteúdo. */

test("a prévia existe, não é indexável e não está no sitemap", async ({ page, request }) => {
  await page.goto("/preview/nexo");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/preview");

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow:\s*\/preview\//);
});

test("a /nexo atual continua intacta — sem as seções novas", async ({ page }) => {
  await page.goto("/nexo");
  await expect(page.locator("#orquestrador")).toHaveCount(0);
  await expect(page.locator("#na-pratica")).toHaveCount(0);
});

test("a capa é o orquestrador: h1 sobre o orquestrador, nove módulos no grafo, links para as seções", async ({ page }) => {
  await page.goto("/preview/nexo");
  const mapa = page.locator("#orquestrador");
  /* A manchete fala do orquestrador, não do módulo de Compras — era o ponto
     do pedido. E é h1: a capa é a primeira coisa da página. */
  await expect(mapa.getByRole("heading", { level: 1 })).toContainText("Nexo orquestra");
  await expect(mapa.getByRole("img", { name: /orquestrador, conectado aos nove módulos/ })).toBeAttached();

  /* Nove, não dez: o Nexo é o orquestrador, não um módulo. O erro de contagem
     aconteceu uma vez e o teste existe para não acontecer de novo. */
  for (const nome of [
    "Compras",
    "Gestão de Ativos",
    "Otimização Spend Logístico",
    "Spend via dados da NF",
    "Contas a Pagar",
    "Benchmark de Preços Varejo",
    "Orçamento",
    "Contratos",
    "Homologação Fornecedores",
  ]) {
    await expect(mapa.getByText(nome, { exact: true })).toBeAttached();
  }

  // Compras aponta para o fluxo que a página já conta, não repete o conteúdo.
  await expect(mapa.locator('a[href="#fluxo-compras"]').first()).toBeAttached();
  await expect(page.locator("#fluxo-compras")).toHaveCount(1);
});

test("cada módulo 'na prática' traz três passos e o número de prova do pitch", async ({ page }) => {
  await page.goto("/preview/nexo");
  const provas: Record<string, string> = {
    logistico: "+900",
    varejo: "28%",
    nf: "$216k",
    orcamento: "100%",
  };
  for (const [id, numero] of Object.entries(provas)) {
    const bloco = page.locator(`#na-pratica-${id}`);
    await expect(bloco.getByRole("listitem")).toHaveCount(3);
    await expect(bloco.getByText(numero, { exact: true })).toBeVisible();
  }
  // Orçamento não tem tela ainda — e não pode fingir que tem.
  await expect(page.locator("#na-pratica-orcamento img")).toHaveCount(0);
  await expect(page.locator("#na-pratica-logistico img")).toHaveCount(2);
});

test("o comparativo compara com 'SaaS de Compras' e não nomeia concorrentes", async ({ page }) => {
  await page.goto("/preview/nexo");
  const sec = page.locator("#comparativo");
  await expect(sec.getByRole("table")).toBeVisible();
  await expect(sec.getByRole("row")).toHaveCount(6); // cabeçalho + 5 critérios
  await expect(sec.getByText("Agente operando em 90 dias")).toBeVisible();
  /* Decisões registradas no plano: sem nomes de concorrentes (propaganda
     comparativa contestável) e sem "única" na ISO (exclusividade pública
     difícil de sustentar). Se algum dos dois voltar, o teste avisa. */
  for (const nome of ["GEP", "Coupa", "Ariba", "Nimbi", "Mercado Eletrônico"]) {
    await expect(sec.getByText(nome)).toHaveCount(0);
  }
  await expect(sec.getByText(/única/i)).toHaveCount(0);
});
