import { test, expect } from "@playwright/test";

const email = `e2e-assinar-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

/**
 * NUNCA submeter este formulário com CPF válido no e2e: a chave ASAAS do
 * .env.local é de PRODUÇÃO. CPF inválido é seguro — a server action recusa
 * na validação, antes de qualquer chamada de rede.
 */
test("assinar mostra resumo e campo CPF; CPF inválido é recusado no servidor", async ({ page }) => {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill("Aluno Assinar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.goto("/app/assinar");
  await expect(page.getByRole("heading", { name: "Assinar a Academy" })).toBeVisible();
  await expect(page.getByText("R$ 39,90", { exact: false })).toBeVisible();

  await page.getByLabel("CPF").fill("111.111.111-11");
  await page.getByRole("button", { name: "Ir para o pagamento" }).click();
  await expect(page.getByText("CPF inválido. Confira os números e tente de novo.")).toBeVisible();
});
