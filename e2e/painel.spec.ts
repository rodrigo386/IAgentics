import { test, expect } from "@playwright/test";

const email = `e2e-painel-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

/**
 * Painel editorial: hero + trilhos por estado do aluno.
 * Aluno novo: hero de boas-vindas; trilhos Formações (1 curso com aulas na
 * semente) e Em gravação (8 cascas) => exatamente 9 cards.
 * Após concluir uma aula: hero vira "Continuar:" e o trilho Em andamento
 * aparece (o curso repete em Formações — repetição intencional do spec).
 */
test("painel editorial: boas-vindas, trilhos e hero de continuar", async ({ page }) => {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill("Aluno Painel");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);

  // Aluno novo: hero de boas-vindas com CTA para a primeira formação com aulas.
  await expect(page.getByText("Bem-vindo à Academy")).toBeVisible();
  await expect(page.getByRole("link", { name: "Começar o curso" })).toBeVisible();

  // Trilhos: rótulos e contagem exata (1 formação com aulas + 8 em gravação).
  await expect(page.getByText("Formações", { exact: true })).toBeVisible();
  await expect(page.getByText("Em gravação", { exact: true })).toBeVisible();
  await expect(page.getByTestId("card-curso")).toHaveCount(9);

  // Capas carregam de verdade (rola até cada card antes de medir — lazy).
  const cards = page.getByTestId("card-curso");
  for (let i = 0; i < 9; i++) {
    await cards.nth(i).scrollIntoViewIfNeeded();
    await expect
      .poll(async () =>
        cards.nth(i).locator("img").evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0),
      )
      .toBe(true);
  }

  // Conclui a aula gratuita e volta ao painel.
  await page.goto("/app/curso/fundamentos-ia-copilot/boas-vindas");
  await page.getByRole("button", { name: "Marcar como concluída" }).click();
  await expect(page.getByRole("link", { name: "Próxima aula" })).toBeVisible();

  await page.goto("/app");
  await expect(page.getByRole("link", { name: /^Continuar:/ })).toBeVisible();
  await expect(page.getByText("Em andamento", { exact: true })).toBeVisible();
  // Curso em andamento repete em Formações: 10 cards agora.
  await expect(page.getByTestId("card-curso")).toHaveCount(10);
});
