import { execSync } from "node:child_process";
import { test, expect, type Page } from "@playwright/test";

const email = `e2e-admgate-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

async function criarConta(page: Page, em: string) {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill("Gate E2E");
  await page.getByLabel("E-mail").fill(em);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test("aluno comum recebe 404 no /admin", async ({ page }) => {
  await criarConta(page, email);
  const resposta = await page.goto("/admin");
  expect(resposta!.status()).toBe(404);
});

test("promovido por script, entra e vê a shell", async ({ page }) => {
  const em = `e2e-admgate2-${Date.now()}@teste.invalido`;
  await criarConta(page, em);
  execSync(`node scripts/promover-admin.mjs ${em}`, { stdio: "pipe" });
  await page.goto("/admin");
  await expect(page.getByRole("link", { name: "Alunos" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver como aluno" })).toBeVisible();
});

test("sem sessão, /admin manda para o login", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/app\/entrar\?voltar=%2Fadmin/);
});
