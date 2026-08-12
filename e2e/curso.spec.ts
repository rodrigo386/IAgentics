import { test, expect } from "@playwright/test";

const email = `e2e-curso-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

test("página do curso mostra índice com etiqueta grátis, CTA para a próxima aula; slug inexistente dá 404", async ({
  page,
}) => {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill("Aluno Curso");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.goto("/app/curso/fundamentos-ia-copilot");

  await expect(page.getByRole("heading", { name: "Fundamentos de IA com Copilot" })).toBeVisible();
  // Redesign: breadcrumb para o painel e barra de progresso no hero.
  // Escopo em "main": o ShellHeader global também tem um link "Meus cursos"
  // (fora do main), então o locator sem escopo bate em 2 elementos.
  await expect(page.getByRole("main").getByRole("link", { name: "Meus cursos" })).toHaveAttribute(
    "href",
    "/app",
  );
  await expect(page.getByTestId("barra-progresso-curso")).toBeVisible();
  await expect(page.getByText("8 aulas").first()).toBeVisible();

  const primeiraAula = page.getByRole("listitem").first();
  await expect(primeiraAula).toContainText("Grátis");

  const cta = page.getByRole("link", { name: "Começar o curso" });
  await expect(cta).toHaveAttribute("href", "/app/curso/fundamentos-ia-copilot/boas-vindas");

  const resposta = await page.goto("/app/curso/curso-que-nao-existe");
  expect(resposta?.status()).toBe(404);
});
