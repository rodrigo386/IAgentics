import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { Client } from "pg";

/**
 * Desafio das 50 Bolsas (/bolsas, 2026-11-03).
 *
 * O servidor do e2e sobe com o relógio parado em 06/11, dentro da janela
 * (BOLSAS_RELOGIO), e com RESEND_API_KEY vazio: a inscrição manda e-mail do
 * servidor e não há como interceptá-lo pelo navegador (playwright.config.ts).
 *
 * O token do link pessoal só existe no e-mail e no banco; o teste do vídeo o
 * lê do banco local, que o e2e já precisa de pé.
 */

function env(chave: string): string | null {
  try {
    return readFileSync(".env.local", "utf8").match(new RegExp(`^${chave}=(.*)$`, "m"))?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

async function tokenDe(email: string): Promise<string> {
  const db = new Client({ connectionString: env("DATABASE_URL") ?? undefined });
  await db.connect();
  try {
    const r = await db.query<{ token: string }>("select token from bolsas_inscricoes where lower(email) = lower($1)", [email]);
    return r.rows[0].token;
  } finally {
    await db.end();
  }
}

async function preencher(page: Page, email: string) {
  await page.getByLabel("Nome completo").fill("Ana Teste Souza");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("WhatsApp, com DDD").fill("(11) 98888-7777");
  await page.getByLabel("Cargo", { exact: true }).fill("Compradora");
  await page.getByLabel("Seu nível").selectOption("analista");
  await page.getByLabel("Empresa", { exact: true }).fill("Empresa Teste");
  await page.getByLabel("Área", { exact: true }).selectOption("compras");
  await page.getByLabel("Tamanho do time da sua área").selectOption("4-10");
  await page.getByLabel("Perfil no Instagram").fill("@ana.teste");
  await page.getByLabel(/Qual problema do seu trabalho/).fill("Levo 3 horas por semana montando o comparativo de cotações do frete.");
  await page.getByRole("checkbox", { name: /li e aceito o/ }).check();
  await page.getByRole("checkbox", { name: /Estou ciente/ }).check();
}

test("a página mostra a troca, os critérios com os pesos e o formulário aberto", async ({ page }) => {
  await page.goto("/bolsas");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("50 bolsas para resolver um problema real do seu trabalho com IA");
  const criterios = page.getByRole("table").first();
  await expect(criterios.getByRole("row", { name: /Clareza do problema/ })).toContainText("30");
  await expect(page.getByText("Número de seguidores não entra na nota", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Quero me inscrever" }).click();
  await expect(page.getByRole("button", { name: "Enviar inscrição" })).toBeVisible();
  await expect(page.getByRole("link", { name: "regulamento", exact: true })).toHaveAttribute("href", "/bolsas/regulamento");
});

test("inscrição completa: confirmação na tela, depois o vídeo pelo link pessoal", async ({ page }) => {
  const email = `bolsa-${Date.now()}@exemplo-teste.com`;
  await page.goto("/bolsas#inscricao");
  await preencher(page, email);
  // Digitar no problema não apaga a escolha dos selects (componente remontando).
  await expect(page.getByLabel("Seu nível")).toHaveValue("analista");
  await page.getByRole("button", { name: "Enviar inscrição" }).click();
  await expect(page.getByRole("status")).toContainText("Inscrição recebida");

  const token = await tokenDe(email);
  await page.goto(`/bolsas/video/${token}`);
  await expect(page.getByText("Olá, Ana.")).toBeVisible();
  await page.getByLabel("Link do vídeo").fill("https://exemplo.com/video");
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.locator("p[role=alert]")).toContainText("Instagram, do LinkedIn, do YouTube ou do Google Drive");
  await page.getByLabel("Link do vídeo").fill("https://www.instagram.com/reel/abc123/");
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByRole("status")).toContainText("Recebemos o seu vídeo");

  await page.reload();
  await expect(page.getByRole("link", { name: "https://www.instagram.com/reel/abc123/" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Trocar link" })).toBeVisible();
});

test("a rota confere tudo de novo: caixa obrigatória, isca, repetição e token inválido", async ({ request, page }) => {
  const base = {
    nome: "Ana Teste Souza", email: `rota-${Date.now()}@exemplo-teste.com`, whatsapp: "11988887777", cargo: "Compradora",
    nivel: "analista", empresa: "Empresa Teste", area: "compras", tamanhoTime: "1-3", instagram: "@ana", linkedin: "",
    problema: "Levo 3 horas por semana montando o comparativo.", regulamento: true, cienciaDados: true,
  };
  const semAceite = await request.post("/api/bolsas", { data: { ...base, regulamento: false } });
  expect(semAceite.status()).toBe(422);
  expect(await semAceite.json()).toEqual({ error: "regulamento" });

  expect((await request.post("/api/bolsas", { data: { site: "spam.example" } })).status()).toBe(200);

  // Repetir o e-mail responde igual e não duplica (o índice único garante).
  expect((await request.post("/api/bolsas", { data: base })).status()).toBe(200);
  expect((await request.post("/api/bolsas", { data: { ...base, nome: "Outra Pessoa" } })).status()).toBe(200);

  expect((await request.post("/api/bolsas/video", { data: { token: "x".repeat(43), url: "https://youtu.be/a" } })).status()).toBe(404);
  await page.goto(`/bolsas/video/${"x".repeat(43)}`);
  await expect(page.getByText("Este link não é válido")).toBeVisible();
});

test("o regulamento abre e volta para o desafio", async ({ page }) => {
  await page.goto("/bolsas/regulamento");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Regulamento do Desafio das 50 Bolsas");
  await expect(page.getByRole("heading", { name: "6. Cotas, desempate e lista de espera" })).toBeVisible();
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
  expect(await painel.text()).toContain("Com vídeo");
  const csv = await request.get("/admin/bolsas/inscricoes.csv", { headers: auth });
  expect(csv.headers()["content-type"]).toContain("text/csv");
  const texto = await csv.text();
  expect(texto).toContain("a1_clareza");
  expect(texto).not.toContain("token");
});
