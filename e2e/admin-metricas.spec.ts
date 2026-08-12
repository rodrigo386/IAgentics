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
  await expect(page).toHaveURL(/\/admin\?periodo=7/);

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
