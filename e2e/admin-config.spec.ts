import { execSync } from "node:child_process";
import { test, expect, type Page } from "@playwright/test";

const emailAdmin = `e2e-admconfig-adm-${Date.now()}@teste.invalido`;
const emailAluno = `e2e-admconfig-aluno-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";
const AVISO_TESTE = "Manutenção programada teste-e2e";

async function criarConta(page: Page, email: string, nome: string) {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test("admin muda aviso do topo e destino do CTA; aluno (contexto separado) vê o efeito ao vivo — reverte no fim", async ({
  browser,
}) => {
  const contextoAdmin = await browser.newContext();
  const paginaAdmin = await contextoAdmin.newPage();
  await criarConta(paginaAdmin, emailAdmin, "Admin E2E Config");
  execSync(`node scripts/promover-admin.mjs ${emailAdmin}`, { stdio: "pipe" });

  const contextoAluno = await browser.newContext();
  const paginaAluno = await contextoAluno.newPage();
  await criarConta(paginaAluno, emailAluno, "Aluno E2E Config");

  await paginaAdmin.goto("/admin/configuracoes");
  const campoAviso = paginaAdmin.getByLabel("Aviso no topo da área do aluno (vazio = sem aviso)");
  const campoCta = paginaAdmin.getByLabel("Destino do botão de venda (URL)");

  // As chaves são globais (settings), compartilhadas com o banco de dev real —
  // captura o valor atual de cada uma para restaurar exatamente ao final, em
  // vez de assumir que estavam vazias (mesmo cuidado do afterAll de
  // lib/admin/configuracoes.test.ts).
  const avisoOriginal = await campoAviso.inputValue();
  const ctaOriginal = await campoCta.inputValue();

  // Admin define o aviso do topo.
  await campoAviso.fill(AVISO_TESTE);
  await paginaAdmin.getByRole("button", { name: "Salvar" }).click();
  await expect(paginaAdmin.getByText("Salvo.", { exact: true })).toBeVisible();

  // Sessão do ALUNO (contexto separado) vê a faixa no /app.
  await paginaAluno.goto("/app");
  await expect(paginaAluno.getByText(AVISO_TESTE)).toBeVisible({ timeout: 15_000 });

  // Admin limpa o campo → a faixa some para o aluno.
  await campoAviso.fill("");
  await paginaAdmin.getByRole("button", { name: "Salvar" }).click();
  await expect(paginaAdmin.getByText("Salvo.", { exact: true })).toBeVisible();

  await paginaAluno.reload();
  await expect(paginaAluno.getByText(AVISO_TESTE)).not.toBeVisible({ timeout: 15_000 });

  // cta_destino inválido ("abc", não começa com / nem http(s)://) → mensagem
  // de erro, e o valor NÃO é salvo (confere pelo reload).
  await campoCta.fill("abc");
  await paginaAdmin.getByRole("button", { name: "Salvar" }).click();
  await expect(paginaAdmin.getByText("Informe uma URL válida (comece com / ou https://)")).toBeVisible();
  await paginaAdmin.reload();
  await expect(paginaAdmin.getByLabel("Destino do botão de venda (URL)")).toHaveValue(ctaOriginal);

  // Restaura aviso_topo/cta_destino ao valor anterior — outros specs (e o
  // próximo run desta suíte) não podem herdar a faixa nem um destino de teste.
  await paginaAdmin.getByLabel("Aviso no topo da área do aluno (vazio = sem aviso)").fill(avisoOriginal);
  await paginaAdmin.getByLabel("Destino do botão de venda (URL)").fill(ctaOriginal);
  await paginaAdmin.getByRole("button", { name: "Salvar" }).click();
  await expect(paginaAdmin.getByText("Salvo.", { exact: true })).toBeVisible();

  await contextoAdmin.close();
  await contextoAluno.close();
});
