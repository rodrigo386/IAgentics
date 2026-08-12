import { test, expect } from "@playwright/test";

const email = `e2e-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

test("visitante sem sessão é levado ao login", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app\/entrar/);
});

test("cria conta, sai e entra de novo", async ({ page }) => {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill("Aluno E2E");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/app\/entrar/);

  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/app$/);
});

test("senha errada não revela qual campo falhou", async ({ page }) => {
  await page.goto("/app/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("errada-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos")).toBeVisible();
});
