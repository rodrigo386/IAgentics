import { test, expect } from "@playwright/test";

const email = `e2e-painel-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

/**
 * O catálogo espelha o site do Academy: as 9 formações publicadas, com capa.
 * (Antes desta decisão de produto, 8 eram cascas ocultas e este spec asseverava
 * a ausência delas; a invariante "publicado=false não aparece" continua coberta
 * pelos testes de integração de autorização, que criam curso oculto próprio.)
 */
test("painel mostra o catálogo completo publicado, com capas", async ({ page }) => {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill("Aluno Painel");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await expect(page.getByText("Fundamentos de IA com Copilot")).toBeVisible();
  await expect(page.getByText("Imersão de Assistentes de IA para Negócios")).toBeVisible();
  await expect(page.getByText("Neurociência & Produtividade")).toBeVisible();

  // Exatamente os 9 do catálogo — nem cartão a mais, nem faltando.
  await expect(page.getByTestId("card-curso")).toHaveCount(9);

  // Toda capa renderizada de verdade (imagem carregada, não alt quebrado).
  const capas = page.getByTestId("card-curso").locator("img");
  for (let i = 0; i < 9; i++) {
    await expect
      .poll(async () => capas.nth(i).evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
  }
});
