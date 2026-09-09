import { test, expect } from "@playwright/test";

/* O convite em vídeo da Academy. O que estes testes protegem não é a presença
   do vídeo — é que ele não comece sozinho, não baixe sem ser pedido, e tenha
   legenda que uma máquina consiga ler. */

test("o vídeo está na página, com poster e sem autoplay", async ({ page }) => {
  await page.goto("/academy");
  const video = page.locator("#convite video");
  await expect(video).toBeVisible();

  /* Vídeo com voz que toca sozinho é hostil: o visitante ouve som e não sabe de
     onde veio. Controles sim, autoplay não. */
  await expect(video).toHaveAttribute("controls", "");
  expect(await video.getAttribute("autoplay")).toBeNull();
  expect(await video.getAttribute("loop")).toBeNull();

  /* preload="none" é o que faz os 25 MB só saírem do servidor para quem
     aperta play — e é por isso que o poster não é opcional. */
  await expect(video).toHaveAttribute("preload", "none");
  await expect(video).toHaveAttribute("poster", /academy-convite-poster/);
});

test("tem legendas em arquivo, não queimadas na imagem", async ({ page, request }) => {
  await page.goto("/academy");
  const track = page.locator("#convite video track");
  await expect(track).toHaveAttribute("kind", "captions");
  await expect(track).toHaveAttribute("srclang", "pt-BR");

  /* O arquivo precisa existir e ser VTT de verdade: um <track> apontando para
     404 é pior que nenhum, porque o navegador oferece a legenda e ela não vem. */
  const vtt = await request.get("/academy/academy-convite.vtt");
  expect(vtt.status()).toBe(200);
  const texto = await vtt.text();
  expect(texto.startsWith("WEBVTT")).toBe(true);
  expect(texto).toContain("-->");

  /* Nomes próprios revisados: o reconhecimento automático escreveu "Xacademy"
     e "on-demain". Se a transcrição for regerada sem revisão, este teste avisa. */
  expect(texto).not.toContain("Xacademy");
  expect(texto).not.toContain("on-demain");
  expect(texto).toContain("IAgentics Academy");
});

test("o vídeo e o poster respondem, e o poster é leve", async ({ request }) => {
  const poster = await request.get("/academy/academy-convite-poster.jpg");
  expect(poster.status()).toBe(200);
  /* O poster sustenta o quadro até o play; se ele engordar, o ganho do
     preload="none" vai embora. */
  expect(Number(poster.headers()["content-length"] ?? 0)).toBeLessThan(200_000);

  const video = await request.fetch("/academy/academy-convite.mp4", { method: "HEAD" });
  expect(video.status()).toBe(200);
  expect(video.headers()["content-type"]).toContain("video");
});

test("a duração fica escrita na página", async ({ page }) => {
  await page.goto("/academy");
  /* Com preload="none" o controle mostra 0:00 até o play: sete minutos e meio
     é informação que muda a decisão de assistir, e precisa estar em texto. */
  await expect(page.locator("#convite")).toContainText("7 min 31");
});

/* A posição do vídeo é decisão do Rodrigo (2026-09-09), não acidente de
   montagem: ele saiu de junto do contato e passou a abrir a página, entre as
   duas faixas de prova. Sem este teste, um reagrupamento de seções o devolveria
   ao fim sem ninguém perceber. */
test("o convite fica entre os apoiadores e a faixa de clientes", async ({ page }) => {
  await page.goto("/academy");

  const marcas = await page.locator("main > section").evaluateAll((secoes) =>
    secoes.map((s) => {
      if (s.id) return `#${s.id}`;
      if (s.classList.contains("assurance-band")) return "clientes";
      return s.textContent?.includes("Apoiadores") ? "apoiadores" : "outra";
    }),
  );

  const posicao = (marca: string) => marcas.indexOf(marca);
  expect(posicao("apoiadores"), "faixa de apoiadores não encontrada").toBeGreaterThanOrEqual(0);
  expect(posicao("#convite")).toBe(posicao("apoiadores") + 1);
  expect(posicao("clientes")).toBe(posicao("#convite") + 1);
});
