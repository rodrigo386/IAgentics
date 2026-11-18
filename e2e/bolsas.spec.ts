import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * Desafio Prova Real (/bolsas; refeito em 2026-11-18).
 *
 * O servidor do e2e sobe com o relógio parado em 24/11, dentro da janela
 * (BOLSAS_RELOGIO), e com RESEND_API_KEY vazio: a inscrição manda e-mail do
 * servidor e não há como interceptá-lo pelo navegador (playwright.config.ts).
 */

function env(chave: string): string | null {
  try {
    return readFileSync(".env.local", "utf8").match(new RegExp(`^${chave}=(.*)$`, "m"))?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

async function preencher(page: Page, email: string) {
  await page.getByLabel("Nome completo").fill("Ana Teste Souza");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("WhatsApp, com DDD").fill("(11) 98888-7777");
  await page.getByLabel("Empresa", { exact: true }).fill("Empresa Teste");
  await page.getByLabel("Perfil no Instagram").fill("@ana.teste");
  await page.getByLabel(/Qual problema do seu dia a dia/).fill("Levo 3 horas por semana montando o comparativo de cotações do frete.");
  await page.getByRole("checkbox", { name: /li e aceito o/ }).check();
  await page.getByRole("checkbox", { name: /Estou ciente/ }).check();
}

test("a capa destaca a oferta (30 dias grátis, R$ 29,90 contra R$ 49,90, -40%), a exclusividade e o botão", async ({ page }) => {
  await page.goto("/bolsas");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "30 dias grátis. 50 bolsas para provar com IA um problema real do seu trabalho.",
  );
  await expect(page.locator("del")).toHaveText("R$ 49,90");
  await expect(page.locator("strong", { hasText: "R$ 29,90" })).toBeVisible();
  await expect(page.getByText("40% de desconto")).toBeAttached();
  await expect(page.getByText("Só 50 vagas")).toBeVisible();
  await expect(page.locator("#cta-bolsas")).toHaveText("Quero minha bolsa");
  // Relógio do e2e parado em 24/11 12h: faltam 11 dias, 11 horas e 59 min para o fim.
  await expect(page.getByLabel(/As inscrições terminam em 11 dias, 11 horas e 59 min/).filter({ visible: true }).first()).toBeVisible();
  await page.locator("#cta-bolsas").click();
  await expect(page.getByRole("button", { name: "Enviar inscrição" })).toBeVisible();
  await expect(page.getByRole("link", { name: "regulamento", exact: true })).toHaveAttribute("href", "/bolsas/regulamento");
});

test("os quatro critérios e o perfil da Academy estão na página, e o vídeo de entrada saiu", async ({ page }) => {
  await page.goto("/bolsas");
  for (const nome of ["Clareza do problema", "Entendimento da solução em 30 dias", "Seguir a página da IAgentics Academy", "Publicar o post do desafio"]) {
    await expect(page.getByRole("heading", { name: nome })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /Seguir @iagenticsacademy/ })).toHaveAttribute("href", "https://www.instagram.com/iagenticsacademy");
  await expect(page.getByText("23 de novembro a 5 de dezembro").first()).toBeVisible();
  await expect(page.getByText("24 de dezembro").first()).toBeVisible();
  await expect(page.getByText(/vídeo de entrada|60 segundos/i)).toHaveCount(0);
});

test("inscrição completa: o formulário pede só os campos do mapa e confirma na tela", async ({ page }) => {
  await page.goto("/bolsas#inscricao");
  for (const antigo of ["Cargo", "Seu nível", "Área", "Tamanho do time da sua área"]) {
    await expect(page.getByLabel(antigo, { exact: true })).toHaveCount(0);
  }
  await expect(page.getByRole("checkbox", { name: /grupo exclusivo do desafio no WhatsApp/ })).not.toBeChecked();
  await preencher(page, `bolsa-${Date.now()}@exemplo-teste.com`);
  await page.getByRole("checkbox", { name: /grupo exclusivo/ }).check();
  await page.getByRole("button", { name: "Enviar inscrição" }).click();
  await expect(page.getByRole("status")).toContainText("Inscrição recebida");
});

test("a rota confere tudo de novo: caixa obrigatória, isca, repetição e a rota do vídeo que saiu", async ({ request }) => {
  const base = {
    nome: "Ana Teste Souza", email: `rota-${Date.now()}@exemplo-teste.com`, whatsapp: "11988887777", empresa: "Empresa Teste",
    instagram: "@ana", linkedin: "", problema: "Levo 3 horas por semana montando o comparativo.", regulamento: true, cienciaDados: true,
  };
  const semAceite = await request.post("/api/bolsas", { data: { ...base, regulamento: false } });
  expect(semAceite.status()).toBe(422);
  expect(await semAceite.json()).toEqual({ error: "regulamento" });

  expect((await request.post("/api/bolsas", { data: { site: "spam.example" } })).status()).toBe(200);

  // Repetir o e-mail responde igual e não duplica (o índice único garante).
  expect((await request.post("/api/bolsas", { data: base })).status()).toBe(200);
  expect((await request.post("/api/bolsas", { data: { ...base, nome: "Outra Pessoa" } })).status()).toBe(200);

  expect((await request.post("/api/bolsas/video", { data: { token: "x".repeat(43), url: "https://youtu.be/a" } })).status()).toBe(404);
  expect((await request.get(`/bolsas/video/${"x".repeat(43)}`)).status()).toBe(404);
});

test("o regulamento abre e volta para o desafio", async ({ page }) => {
  await page.goto("/bolsas/regulamento");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Regulamento do Desafio Prova Real");
  await expect(page.getByRole("heading", { name: "4. Critérios de seleção" })).toBeVisible();
  await page.getByRole("link", { name: "Voltar para o desafio" }).click();
  await expect(page).toHaveURL(/\/bolsas$/);
});

test("o painel e o CSV das bolsas ficam atrás da senha", async ({ request }) => {
  for (const rota of ["/admin/bolsas", "/admin/bolsas/inscricoes.csv"]) {
    expect((await request.get(rota)).status(), rota).toBe(401);
  }
  const usuario = env("ADMIN_USUARIO");
  const senha = env("ADMIN_SENHA");
  test.skip(!usuario || !senha, "sem ADMIN_USUARIO/ADMIN_SENHA no .env.local");
  const auth = { Authorization: "Basic " + Buffer.from(`${usuario}:${senha}`).toString("base64") };
  const painel = await request.get("/admin/bolsas", { headers: auth });
  expect(painel.status()).toBe(200);
  const html = await painel.text();
  expect(html).toContain("Querem o grupo de WhatsApp");
  /* Com ao menos uma inscrição (o teste da inscrição completa vem antes), a
     seleção aparece: ranking, resultado por e-mail e a avaliação de cada um. */
  expect(html).toContain("Aplicar o ranking");
  expect(html).toContain("Resultado por e-mail");
  expect(html).toContain("Clareza (0 a 10)");
  const csv = await request.get("/admin/bolsas/inscricoes.csv", { headers: auth });
  expect(csv.headers()["content-type"]).toContain("text/csv");
  const texto = await csv.text();
  expect(texto).toContain("seguiu_academy");
  expect(texto.split("\n")[0]).toContain("status");
  expect(texto).not.toContain("token");
});
