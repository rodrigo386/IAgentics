import { test, expect } from "@playwright/test";

/* Home alinhada ao pitch Hacktown (2026-09-04). Nasceu como /preview/home e
   virou oficial depois de aprovada. */

test("a hero usa o grafo do orquestrador e mantém a manchete do pitch", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Compras e Gestão de Gastos");
  await expect(page.locator("#topo .orq-pulse")).toHaveCount(9);
  // O subtexto não fala mais só de "suprimentos".
  await expect(page.locator("#topo")).not.toContainText("suprimentos");
  /* Subtexto reescrito em 2026-09-22: saiu "Nove módulos" e entrou a posição
     de mercado, com os dois ambientes e a certificação. */
  await expect(page.locator("#topo")).toContainText("Primeira empresa brasileira");
  await expect(page.locator("#topo")).toContainText("ISO/IEC 27001");
  /* O "NEXO APP" sob o grafo saiu no mesmo dia, e com ele o ÚNICO link da hero
     para /nexo. Se voltar a existir um, foi decisão — não acidente. */
  await expect(page.locator('#topo a[href="/nexo"]')).toHaveCount(0);
  await expect(page.locator("#topo")).not.toContainText("NEXO APP");
  /* As parcerias subiram para dentro da coluna, logo abaixo dos CTAs
     (2026-09-22). O que importa travar é que continuem na primeira tela e com
     as cinco placas — no pé da seção, onde estavam, dependiam de rolar. */
  const parcerias = page.locator('#topo ul[aria-label="Parcerias"]');
  await expect(parcerias.getByRole("listitem")).toHaveCount(5);
  await expect(parcerias).toBeVisible();
});

test("'O problema' traz os dois números do pitch com a fonte visível", async ({ page }) => {
  await page.goto("/");
  const sec = page.locator("#problema");
  await expect(sec.getByText("57%", { exact: true })).toBeVisible();
  await expect(sec.getByText("70%", { exact: true })).toBeVisible();
  /* Número sem fonte na tela é o que a regra de copy proíbe: as duas
     referências McKinsey precisam estar renderizadas, não só no código. */
  await expect(sec.getByText(/McKinsey Global Institute/)).toBeVisible();
  await expect(sec.getByText(/Procurement insights/)).toBeVisible();
  await expect(sec.getByRole("listitem")).toHaveCount(6);
});

test("o cartão do Nexo é o orquestrador com os nove módulos em chips", async ({ page }) => {
  await page.goto("/");
  const card = page.locator('#solucoes a[href="/nexo"]');
  await expect(card.getByText("Orquestrador de gestão de gastos")).toBeVisible();
  await expect(card.getByRole("listitem")).toHaveCount(9);
  // Os chips antigos dos agentes (RC, RFP) não aparecem mais.
  await expect(card.getByText("RFP", { exact: true })).toHaveCount(0);
  // Os outros dois cartões não mudaram.
  await expect(page.locator('#solucoes a[href="/academy"]').getByRole("listitem")).toHaveCount(3);
});

test("as rotas de prévia não existem mais", async ({ page }) => {
  for (const rota of ["/preview/home", "/preview/nexo"]) {
    const r = await page.goto(rota);
    expect(r?.status(), `${rota} deveria ser 404`).toBe(404);
  }
});

/* "Palco fixo" das 3 soluções (2026-10-07): um filme por solução, um só em
   cena por vez, e o palco troca quando o mouse chega no nome. */
test("as soluções trocam o filme do palco", async ({ page }) => {
  await page.goto("/");
  const sec = page.locator("#solucoes");
  const filmes = sec.locator("video");
  await expect(filmes).toHaveCount(3);
  await sec.scrollIntoViewIfNeeded();
  await sec.locator('a[href="/academy"]').hover();
  await expect(sec.locator('video[src="/solucoes/solucao-academy.mp4"]')).toHaveClass(/opacity-100/);
  await expect(sec.locator('video[src="/solucoes/solucao-nexo.mp4"]')).toHaveClass(/opacity-0/);
  await expect.poll(() => sec.locator('video[src="/solucoes/solucao-academy.mp4"]').evaluate((v: HTMLVideoElement) => !v.paused)).toBe(true);
});
