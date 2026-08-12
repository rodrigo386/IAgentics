import { test, expect } from "@playwright/test";

const email = `e2e-aula-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

test("aula gratuita toca e conclui; aula paga mostra trava de assinatura sem 404", async ({ page }) => {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill("Aluno Aula");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);

  // Aula gratuita: player visível, marca concluída, botão vira "Próxima aula".
  await page.goto("/app/curso/fundamentos-ia-copilot/boas-vindas");
  await expect(page.locator('iframe[src*="youtube-nocookie"]')).toBeVisible();

  await page.getByRole("button", { name: "Marcar como concluída" }).click();
  await expect(page.getByRole("link", { name: "Próxima aula" })).toBeVisible();

  // Recarrega a página do curso: progresso persistiu no servidor.
  await page.goto("/app/curso/fundamentos-ia-copilot");
  await expect(page.getByText("1 de 8 aulas concluídas")).toBeVisible();

  // Aula paga: URL direta não dá 404; sem player; cartão de trava com CTA.
  const resposta = await page.goto("/app/curso/fundamentos-ia-copilot/o-que-e-copilot");
  expect(resposta?.status()).toBe(200);
  await expect(page.locator('iframe[src*="youtube-nocookie"]')).toHaveCount(0);
  await expect(page.getByText("Esta aula faz parte da assinatura")).toBeVisible();
  await expect(page.getByRole("link", { name: "Falar com a IAgentics" })).toHaveAttribute(
    "href",
    "/academy#contato",
  );
});
