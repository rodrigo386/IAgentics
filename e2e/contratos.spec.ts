import { execSync } from "node:child_process";
import { test, expect, type Page } from "@playwright/test";

const senha = "Senha-e2e-123!";

async function criarConta(page: Page, email: string, nome: string) {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

/**
 * Venda B2B ponta a ponta, pela interface de verdade.
 *
 * A asserção que dá sentido ao desenho inteiro está no meio deste teste: o
 * aluno de contrato vê UM curso liberado e o banner "Assine para acessar" ao
 * mesmo tempo. Não é contradição — são as duas perguntas que a etapa 1
 * separou: ele TEM direito àquele curso (contrato) e NÃO é assinante
 * (comercial). Se algum dia alguém reunificar as duas, este teste cai.
 */
test("contrato B2B: criar, importar lista, aluno acessa só o curso do contrato, remoção corta", async ({ browser }) => {
  const carimbo = Date.now();
  const emailAdmin = `e2e-b2b-adm-${carimbo}@teste.invalido`;
  const emailMembro = `e2e-b2b-membro-${carimbo}@teste.invalido`;

  const ctxAdmin = await browser.newContext();
  const admin = await ctxAdmin.newPage();
  await criarConta(admin, emailAdmin, "Admin B2B");
  execSync(`node scripts/promover-admin.mjs ${emailAdmin}`, { stdio: "pipe" });

  // --- empresa ---
  await admin.goto("/admin/empresas");
  await admin.getByLabel("Nome da empresa").fill(`Empresa E2E ${carimbo}`);
  await admin.getByRole("button", { name: "Criar empresa" }).click();
  await expect(admin.getByText("Empresa criada.")).toBeVisible();

  // --- contrato: 2 vagas, 1 curso ---
  await admin.getByLabel("Vagas").fill("2");
  await admin.getByLabel("Valor do contrato (R$)").fill("9000.00");
  await admin.getByRole("checkbox", { name: "Fundamentos de IA com Copilot" }).check();
  await admin.getByRole("button", { name: "Criar contrato" }).click();
  await expect(admin.getByText("Contrato criado.")).toBeVisible();
  await expect(admin.getByText("0 / 2 vagas usadas")).toBeVisible();

  // --- importar a lista (caixa MISTA de propósito: é o que vem de planilha) ---
  await admin.getByRole("textbox", { name: "E-mails" }).fill(emailMembro.toUpperCase());
  await admin.getByRole("button", { name: "Confirmar importação" }).click();
  await expect(admin.getByText("Lista importada.")).toBeVisible();
  await expect(admin.getByText("1 / 2 vagas usadas")).toBeVisible();
  // Ainda sem conta: pré-autorizado, aguardando cadastro.
  await expect(admin.getByText("Aguardando cadastro")).toBeVisible();

  // --- a pessoa cria a própria conta, com o e-mail em minúsculo ---
  const ctxAluno = await browser.newContext();
  const aluno = await ctxAluno.newPage();
  await criarConta(aluno, emailMembro, "Membro B2B");

  // UM curso liberado (o do contrato) e o resto com cadeado.
  const cards = aluno.getByTestId("card-curso");
  const total = await cards.count();
  const cadeados = aluno.locator('[data-testid="card-curso"]', { hasText: "Assine para acessar" });
  await expect(cadeados).toHaveCount(total - 1);

  /* As DUAS perguntas, lado a lado: tem direito ao curso do contrato, e
     continua não sendo assinante — então o banner de assinatura permanece.
     É exatamente a separação que a etapa 1 introduziu. */
  await expect(aluno.locator("p", { hasText: "Assine para acessar" })).toBeVisible();

  // E o curso do contrato abre de verdade.
  await aluno.goto("/app/curso/fundamentos-ia-copilot");
  await expect(aluno.getByRole("link", { name: /Continuar|Começar|Assistir/ }).first()).toBeVisible();

  // --- o admin remove o membro: acesso cai ---
  await admin.reload();
  await expect(admin.getByText("Conta criada")).toBeVisible();
  await admin.getByRole("button", { name: "Remover" }).click();
  await expect(admin.getByText("Membro removido. O acesso dele cessou.")).toBeVisible();
  await expect(admin.getByText("0 / 2 vagas usadas")).toBeVisible();

  await aluno.goto("/app");
  await expect(aluno.locator('[data-testid="card-curso"]', { hasText: "Assine para acessar" })).toHaveCount(total);

  await ctxAluno.close();
  await ctxAdmin.close();
});

/** Tudo-ou-nada: lista maior que as vagas não entra nem parcialmente. */
test("importação que estoura as vagas é recusada inteira", async ({ browser }) => {
  const carimbo = Date.now();
  const emailAdmin = `e2e-b2b-vaga-${carimbo}@teste.invalido`;

  const ctx = await browser.newContext();
  const admin = await ctx.newPage();
  await criarConta(admin, emailAdmin, "Admin Vagas");
  execSync(`node scripts/promover-admin.mjs ${emailAdmin}`, { stdio: "pipe" });

  await admin.goto("/admin/empresas");
  await admin.getByLabel("Nome da empresa").fill(`Empresa Vagas ${carimbo}`);
  await admin.getByRole("button", { name: "Criar empresa" }).click();

  await admin.getByLabel("Vagas").fill("1");
  await admin.getByLabel("Valor do contrato (R$)").fill("1000.00");
  await admin.getByRole("button", { name: "Criar contrato" }).click();
  await expect(admin.getByText("Contrato criado.")).toBeVisible();

  await admin
    .getByRole("textbox", { name: "E-mails" })
    .fill(`a-${carimbo}@teste.invalido, b-${carimbo}@teste.invalido`);
  await admin.getByRole("button", { name: "Confirmar importação" }).click();

  await expect(admin.getByText("Não há vagas suficientes. Nada foi alterado.")).toBeVisible();
  // Nada gravado: continua zerado.
  await expect(admin.getByText("0 / 1 vagas usadas")).toBeVisible();

  await ctx.close();
});
