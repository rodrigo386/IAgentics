import { test, expect } from "@playwright/test";

/* O depoimento em vídeo da Gabriela Junqueira, na faixa de clientes. O que
   estes testes protegem não é a presença do vídeo — é que ele fique atrelado à
   pessoa que fala (nome, cargo, empresa), não comece sozinho, e que os 2min30
   de fala existam como TEXTO na página, já que as legendas deste arquivo estão
   gravadas na imagem e nenhuma máquina as alcança. */

const BLOCO = "section.assurance-band";

test("o depoimento está na faixa de clientes, com quem fala identificado", async ({ page }) => {
  await page.goto("/academy");
  const bloco = page.locator(BLOCO);

  await expect(bloco).toContainText("Gabriela Junqueira");
  await expect(bloco).toContainText("Head de Compras");
  await expect(bloco).toContainText("Santa Helena");

  /* Depoimento nomeado sem a frase dele é só uma foto: a citação em texto é o
     que um buscador e um agente leem sem abrir o vídeo. */
  await expect(bloco).toContainText("um treinamento que transforma");
});

test("o vídeo não começa sozinho e não baixa sem ser pedido", async ({ page }) => {
  await page.goto("/academy");
  const video = page.locator(`${BLOCO} video`);

  await expect(video).toHaveAttribute("controls", "");
  expect(await video.getAttribute("autoplay")).toBeNull();
  expect(await video.getAttribute("loop")).toBeNull();

  /* 14 MB só saem do servidor para quem aperta play; até lá quem sustenta o
     quadro é o poster. */
  await expect(video).toHaveAttribute("preload", "none");
  await expect(video).toHaveAttribute("poster", /depoimento-gabriela-poster/);
});

/* As legendas deste arquivo estão queimadas na imagem. Um <track> aqui
   desenharia as legendas do navegador POR CIMA delas — duas camadas do mesmo
   texto. É a escolha oposta à do convite, e é deliberada. */
test("não tem <track>: a legenda deste vídeo está na imagem", async ({ page }) => {
  await page.goto("/academy");
  await expect(page.locator(`${BLOCO} video track`)).toHaveCount(0);
});

test("a transcrição existe em texto, fechada por padrão", async ({ page }) => {
  await page.goto("/academy");
  const detalhes = page.locator(`${BLOCO} details`);

  await expect(detalhes).toHaveCount(1);
  /* Fechada: 2min30 de transcrição aberta empurrariam as outras vozes para
     fora da tela. Fechada ≠ ausente — o texto está no DOM, que é o que importa
     para leitor de tela, buscador e para o markdown que servimos a agentes. */
  expect(await detalhes.evaluate((d: HTMLDetailsElement) => d.open)).toBe(false);

  const texto = await detalhes.textContent();
  expect(texto).toContain("IAgentics");
  expect(texto).toContain("Santa Helena");
  expect(texto).toContain("redução de custo");

  /* Erros do reconhecimento automático que foram corrigidos à mão. Se a
     transcrição for regerada sem revisão, eles voltam e este teste avisa. */
  expect(texto).not.toContain("Iagêntics");
  expect(texto).not.toContain("Santelena");
  expect(texto).not.toContain("incrementos");

  /* A honestidade sobre a origem do texto fica na tela, como no convite. */
  expect(texto).toContain("reconhecimento de fala");
});

test("o vídeo e o poster respondem, e o poster é leve", async ({ request }) => {
  const poster = await request.get("/academy/depoimento-gabriela-poster.jpg");
  expect(poster.status()).toBe(200);
  expect(Number(poster.headers()["content-length"] ?? 0)).toBeLessThan(200_000);

  const video = await request.fetch("/academy/depoimento-gabriela.mp4", { method: "HEAD" });
  expect(video.status()).toBe(200);
  expect(video.headers()["content-type"]).toContain("video");
});
