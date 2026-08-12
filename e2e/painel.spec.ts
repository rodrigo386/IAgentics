import { test, expect } from "@playwright/test";

const email = `e2e-painel-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

test("painel mostra só os cursos publicados", async ({ page }) => {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill("Aluno Painel");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await expect(page.getByText("Fundamentos de IA com Copilot")).toBeVisible();
  await expect(page.getByText("Imersão de Assistentes de IA para Negócios")).not.toBeVisible();
});
