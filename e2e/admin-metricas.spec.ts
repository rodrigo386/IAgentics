import { execSync } from "node:child_process";
import { test, expect, type Page } from "@playwright/test";

const emailAdmin = `e2e-admmetricas-adm-${Date.now()}@teste.invalido`;
const emailAluno = `e2e-admmetricas-aluno-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

async function criarConta(page: Page, email: string, nome: string) {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test("admin vê os 5 cartões, troca período por link e baixa um CSV", async ({ page }) => {
  await criarConta(page, emailAdmin, "Admin E2E Métricas");
  execSync(`node scripts/promover-admin.mjs ${emailAdmin}`, { stdio: "pipe" });

  await page.goto("/admin");
  await expect(page.getByText("Alunos totais")).toBeVisible();
  await expect(page.getByText("Novos alunos")).toBeVisible();
  await expect(page.getByText("Assinaturas ativas")).toBeVisible();
  await expect(page.getByText("Alunos ativos")).toBeVisible();
  await expect(page.getByText("Aulas concluídas")).toBeVisible();

  // Filtro de período é um link puro (server-first): clicar muda a URL.
  await page.getByRole("link", { name: "7 dias" }).click();
  // A URL carrega também a aba (padrão app) desde as abas de 2026-08-15.
  await expect(page).toHaveURL(/periodo=7/);

  // Exportar CSV: aciona um download real; nome do arquivo reflete bloco+período.
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Exportar CSV" }).first().click(),
  ]);
  expect(download.suggestedFilename()).toBe("metricas-cadastros-7.csv");
});

test("aluno comum recebe 404 no handler de CSV", async ({ page }) => {
  await criarConta(page, emailAluno, "Aluno E2E Métricas");
  const resposta = await page.request.get("/admin/metricas-csv?bloco=cadastros");
  expect(resposta.status()).toBe(404);
});

// Fix round final (I5): periodo cru fora da união ("7"/"30"/"90"/"tudo")
// batia direto num `as Periodo` sem checagem — 404 aqui prova que o guard
// (ehPeriodoValido) roda mesmo para um admin de verdade, antes de gerar nada.
test("periodo inválido no CSV recebe 404 mesmo para admin autenticado", async ({ page }) => {
  const emailAdminPeriodo = `e2e-admmetricas-periodo-${Date.now()}@teste.invalido`;
  await criarConta(page, emailAdminPeriodo, "Admin E2E Período Inválido");
  execSync(`node scripts/promover-admin.mjs ${emailAdminPeriodo}`, { stdio: "pipe" });

  const resposta = await page.request.get("/admin/metricas-csv?bloco=cadastros&periodo=xyz");
  expect(resposta.status()).toBe(404);
});

test("beacon conta visita e o painel mostra o bloco de tráfego com a página", async ({ page }) => {
  const emailAdminTrafego = `e2e-admmetricas-trafego-${Date.now()}@teste.invalido`;
  await criarConta(page, emailAdminTrafego, "Admin E2E Trafego");
  execSync(`node scripts/promover-admin.mjs ${emailAdminTrafego}`, { stdio: "pipe" });

  // POST direto no coletor (o mesmo formato que o Beacon manda). 204 sempre.
  const resposta = await page.request.post("/api/estatisticas", { data: { rota: "/nexo" } });
  expect(resposta.status()).toBe(204);

  // O tráfego mora na aba Site (2026-08-15); a aba padrão é App.
  await page.goto("/admin?aba=site");
  // .first(): o rótulo também vive na <caption> sr-only do gráfico acessível.
  await expect(page.getByText("Visitas do site").first()).toBeVisible();
  // A linha "Nexo" existe na quebra por página (>=1 visita garantida acima).
  await expect(page.getByText("Nexo", { exact: true })).toBeVisible();
  // O funil site→assinatura renderiza com as quatro etapas.
  await expect(page.getByText("Do site à assinatura")).toBeVisible();
  await expect(page.getByText("Contas criadas")).toBeVisible();
  // A aba App segue com os cartões de sempre + MRR.
  await page.getByRole("link", { name: "App", exact: true }).click();
  await expect(page.getByText("MRR estimado")).toBeVisible();
  await expect(page.getByText("Saúde das assinaturas")).toBeVisible();
});
