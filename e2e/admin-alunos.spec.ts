import { execSync } from "node:child_process";
import { test, expect, type Page } from "@playwright/test";

const emailAdmin = `e2e-admalunos-adm-${Date.now()}@teste.invalido`;
const emailAluno = `e2e-admalunos-aluno-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

async function criarConta(page: Page, email: string, nome: string) {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

const AULA_PAGA = "/app/curso/fundamentos-ia-copilot/o-que-e-copilot";

test("admin busca aluno, libera acesso à aula paga (prova de ponta a ponta), depois revoga", async ({ browser }) => {
  // Dois contextos de navegador = duas sessões independentes: o admin nunca
  // "empresta" a própria sessão para o aluno, e vice-versa — a prova de acesso
  // tem que vir da sessão real do aluno vendo a aula, não da sessão do admin.
  const contextoAdmin = await browser.newContext();
  const paginaAdmin = await contextoAdmin.newPage();
  await criarConta(paginaAdmin, emailAdmin, "Admin E2E Alunos");
  execSync(`node scripts/promover-admin.mjs ${emailAdmin}`, { stdio: "pipe" });

  const contextoAluno = await browser.newContext();
  const paginaAluno = await contextoAluno.newPage();
  await criarConta(paginaAluno, emailAluno, "Aluno E2E Alunos");

  // Linha de base: aluno recém-criado, sem assinatura, vê a trava na aula paga.
  await paginaAluno.goto(AULA_PAGA);
  await expect(paginaAluno.locator('iframe[src*="youtube-nocookie"]')).toHaveCount(0);
  await expect(paginaAluno.getByText("Esta aula faz parte da assinatura")).toBeVisible();

  // Admin busca o aluno pelo e-mail e abre o detalhe.
  await paginaAdmin.goto("/admin/alunos");
  await paginaAdmin.getByLabel("Buscar por nome ou e-mail").fill(emailAluno);
  await paginaAdmin.getByRole("button", { name: "Buscar" }).click();
  const linha = paginaAdmin.getByRole("row").filter({ hasText: emailAluno });
  await expect(linha).toBeVisible();
  await linha.getByRole("link").click();
  await expect(paginaAdmin).toHaveURL(/\/admin\/alunos\/[0-9a-f-]+$/);
  await expect(paginaAdmin.getByRole("heading", { name: "Aluno E2E Alunos" })).toBeVisible();
  await expect(paginaAdmin.getByText("Sem assinatura")).toBeVisible();

  // Libera acesso.
  await paginaAdmin.getByRole("button", { name: "Liberar acesso" }).click();
  await expect(paginaAdmin.getByText("Acesso liberado.")).toBeVisible();
  await expect(paginaAdmin.getByText("Liberada manualmente")).toBeVisible();
  await expect(paginaAdmin.getByRole("button", { name: "Revogar acesso" })).toBeVisible();

  // Sessão do ALUNO (contexto separado) agora enxerga o player da aula paga.
  await paginaAluno.reload();
  await expect(paginaAluno.locator('iframe[src*="youtube-nocookie"]')).toBeVisible();

  // Admin revoga.
  await paginaAdmin.getByRole("button", { name: "Revogar acesso" }).click();
  await expect(paginaAdmin.getByText("Acesso revogado.")).toBeVisible();
  // exact: true porque o histórico logo abaixo também tem uma linha "cancelada"
  // (valor cru do banco, minúsculo) — sem isso a busca por texto é ambígua.
  await expect(paginaAdmin.getByText("Cancelada", { exact: true })).toBeVisible();
  await expect(paginaAdmin.getByRole("button", { name: "Liberar acesso" })).toBeVisible();

  // Aluno recarrega: cartão de trava de volta.
  await paginaAluno.reload();
  await expect(paginaAluno.locator('iframe[src*="youtube-nocookie"]')).toHaveCount(0);
  await expect(paginaAluno.getByText("Esta aula faz parte da assinatura")).toBeVisible();

  await contextoAdmin.close();
  await contextoAluno.close();
});

test("promover a admin, desativar e excluir com confirmação de e-mail", async ({ page, browser }) => {
  const emailAdm = `e2e-admalunos-adm2-${Date.now()}@teste.invalido`;
  const emailAlvo = `e2e-admalunos-alvo-${Date.now()}@teste.invalido`;

  await criarConta(page, emailAdm, "Admin E2E Alunos 2");
  execSync(`node scripts/promover-admin.mjs ${emailAdm}`, { stdio: "pipe" });

  // Segunda conta criada na MESMA sessão de navegador substituiria o cookie —
  // então cria o aluno-alvo num contexto isolado à parte, e volta ao admin.
  const contextoAlvo = await browser.newContext();
  const paginaAlvo = await contextoAlvo.newPage();
  await criarConta(paginaAlvo, emailAlvo, "Alvo E2E Alunos");
  await contextoAlvo.close();

  await page.goto("/admin/alunos");
  await page.getByLabel("Buscar por nome ou e-mail").fill(emailAlvo);
  await page.getByRole("button", { name: "Buscar" }).click();
  await page.getByRole("row").filter({ hasText: emailAlvo }).getByRole("link").click();

  // Promove a admin.
  await page.getByRole("button", { name: "Tornar admin" }).click();
  await expect(page.getByText("Salvo.")).toBeVisible();
  await expect(page.getByText("Admin", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tornar aluno" })).toBeVisible();

  // Desativa a conta.
  await page.getByRole("button", { name: "Desativar conta" }).click();
  await expect(page.getByText("Conta desativada.")).toBeVisible();
  await expect(page.getByText("Desativada", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reativar conta" })).toBeVisible();

  // Exclusão: e-mail divergente barra; e-mail certo apaga e volta pra lista.
  await page.getByText("Excluir conta").click();
  await page.getByLabel("Digite o e-mail do aluno para confirmar").fill("errado@teste.invalido");
  await page.getByRole("button", { name: "Excluir definitivamente" }).click();
  await expect(page.getByText("O e-mail digitado não confere.")).toBeVisible();

  await page.getByLabel("Digite o e-mail do aluno para confirmar").fill(emailAlvo);
  await page.getByRole("button", { name: "Excluir definitivamente" }).click();
  await expect(page).toHaveURL(/\/admin\/alunos\?excluido=1$/);
  await expect(page.getByText("Conta excluída.")).toBeVisible();
});
