import { test, expect } from "@playwright/test";

const email = `e2e-conta-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

test("conta mostra e-mail e status sem assinatura; troca de nome persiste após reload", async ({ page }) => {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill("Aluno Conta");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.goto("/app/conta");
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText("Sem assinatura")).toBeVisible();
  await expect(page.getByLabel("Nome")).toHaveValue("Aluno Conta");

  await page.getByLabel("Nome").fill("Aluno Renomeado");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Salvo.")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Nome")).toHaveValue("Aluno Renomeado");

  await page.getByLabel("Nova senha").fill("Senha-nova-456!");
  await page.getByRole("button", { name: "Trocar senha" }).click();
  await expect(page.getByText("Senha atualizada.")).toBeVisible();
});
