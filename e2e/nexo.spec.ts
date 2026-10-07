import { test, expect } from "@playwright/test";

/* /nexo alinhada ao pitch Hacktown (2026-09-04). Nasceu como /preview/nexo e
   virou oficial depois de aprovada. */

test("a capa é o orquestrador: h1 sobre o orquestrador, nove módulos no grafo, links para as seções", async ({ page }) => {
  await page.goto("/nexo");
  const capa = page.locator("#orquestrador");
  /* A manchete fala do orquestrador, não do módulo de Compras. E é h1: a capa
     é a primeira coisa da página. */
  await expect(capa.getByRole("heading", { level: 1 })).toContainText("Nexo orquestra");
  await expect(capa.getByRole("img", { name: /orquestrador, conectado aos nove módulos/ })).toBeAttached();

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
    await expect(capa.getByText(nome, { exact: true })).toBeAttached();
  }

  // Compras aponta para o fluxo que a página já conta, não repete o conteúdo.
  await expect(capa.locator('a[href="#fluxo-compras"]').first()).toBeAttached();
  await expect(page.locator("#fluxo-compras")).toHaveCount(1);
});

test("a Camada 1 lista os nove módulos, não os cinco agentes do Compras", async ({ page }) => {
  await page.goto("/nexo");
  const camadas = page.locator("#camadas");
  /* getByText, não listitem+filter: a <li> da camada contém a <li> do módulo
     e as duas casariam. */
  await expect(camadas.getByText("Benchmark de Preços Varejo", { exact: true })).toBeVisible();
  await expect(camadas.getByText("Requisição de Compra", { exact: true })).toHaveCount(0);
});

test("cada módulo 'na prática' traz três passos e o número de prova do pitch", async ({ page }) => {
  await page.goto("/nexo");
  const provas: Record<string, string> = { logistico: "+900", varejo: "28%", nf: "$216k", orcamento: "100%" };
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
  await page.goto("/nexo");
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

/* A capa do /nexo passava 64px da dobra (2026-09-22): nesta página o <main>
   tem `pt-16`, então `min-h-[100dvh]` somava a altura do nav à da tela, e a
   faixa de parcerias que fecha a capa ficava cortada pela borda da janela —
   medido, parcerias até y=907 numa janela de 900. O que este teste trava é o
   efeito visível, não a classe: a faixa inteira na primeira tela. */
test("a faixa de parcerias da capa cabe inteira na primeira tela", async ({ browser }) => {
  for (const [largura, altura] of [[1440, 900], [1280, 800]]) {
    const contexto = await browser.newContext({ viewport: { width: largura, height: altura } });
    const page = await contexto.newPage();
    await page.goto("/nexo");
    const caixa = await page.locator('#orquestrador ul[aria-label="Parcerias"]').boundingBox();
    expect(caixa, `${largura}x${altura}: faixa não encontrada`).not.toBeNull();
    expect(caixa!.y + caixa!.height, `${largura}x${altura}: faixa passa da dobra`).toBeLessThanOrEqual(altura);
    await contexto.close();
  }
});

/* Vídeos do Nexo (2026-10-06): mudos em loop, tocando sozinhos quando entram na
   tela. São narrados, então o botão de som volta ao começo e liga a voz. */
test("os vídeos do Nexo tocam mudos e o botão de som liga a narração do começo", async ({ page }) => {
  await page.goto("/nexo");
  const videos = page.locator("video");
  await expect(videos).toHaveCount(3);
  await expect(page.locator('video[src="/nexo/nexo-spend-nf.mp4"]')).toBeAttached();
  await expect(page.locator('video[src="/nexo/nexo-comercial.mp4"]')).toBeAttached();
  await expect(page.locator('video[src="/nexo/nexo-passo-a-passo.mp4"]')).toBeAttached();

  const secao = page.getByRole("region", { name: "Peça. Cote. Autorize." });
  const video = secao.locator("video");
  await video.scrollIntoViewIfNeeded();
  expect(await video.evaluate((v: HTMLVideoElement) => v.muted && v.loop)).toBe(true);
  // Toca sozinho ao entrar na tela.
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused)).toBe(true);

  await secao.getByRole("button", { name: "Assistir do começo com som" }).click();
  expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(false);
  await expect(secao.getByRole("button", { name: "Desligar o som" })).toHaveAttribute("aria-pressed", "true");

  await secao.getByRole("button", { name: "Pausar vídeo" }).click();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await expect(secao.getByRole("button", { name: "Continuar vídeo" })).toBeVisible();
});

/* Desde 2026-10-07 o palco do fluxo de Compras é o vídeo do passo a passo, no
   lugar dos prints: clicar num passo leva o vídeo ao capítulo dele, e o passo
   do capítulo que está passando acende. */
test("no fluxo de Compras, clicar num passo leva o vídeo ao capítulo dele", async ({ page }) => {
  await page.goto("/nexo");
  const fluxo = page.locator("#fluxo-compras");
  await expect(fluxo.locator("img[src*='nexo-print'], img[src*='nexo-fluxo-']")).toHaveCount(0);
  const video = fluxo.locator("video");
  await expect(video).toHaveCount(1);

  await fluxo.getByRole("button", { name: /Ver no vídeo: Negociação com suporte de IA/ }).click();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThanOrEqual(55.6);
  await expect(fluxo.getByText("05 · Negociação com suporte de IA")).toBeVisible();
});

test("o Spend via NF mostra o filme no lugar das telas", async ({ page }) => {
  await page.goto("/nexo");
  const nf = page.locator("#na-pratica-nf");
  await expect(nf.locator("video")).toHaveAttribute("src", "/nexo/nexo-spend-nf.mp4");
  await expect(nf.locator("img[src*='nf-visao-geral'], img[src*='nf-recomendacoes']")).toHaveCount(0);
  // Os outros módulos seguem com as telas.
  await expect(page.locator("#na-pratica-logistico img")).toHaveCount(2);
});
