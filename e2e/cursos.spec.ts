import { test, expect } from "@playwright/test";

const email = `e2e-cursos-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

test("/planos redireciona permanente para /cursos", async ({ page }) => {
  await page.goto("/planos");
  await expect(page).toHaveURL("/cursos");
});

test("/cursos abre sem login: preço, 9 capas e CTAs para criar conta com voltar", async ({ page }) => {
  await page.goto("/cursos");
  await expect(page.getByText("R$ 39,90")).toBeVisible();
  await expect(page.getByTestId("capa-curso")).toHaveCount(9);
  // Dois CTAs de mesma intenção e mesmo rótulo (hero e banda de assinatura),
  // ambos no mesmo destino.
  const ctas = page.getByRole("link", { name: "Assinar agora" });
  await expect(ctas).toHaveCount(2);
  await expect(ctas.first()).toHaveAttribute("href", "/app/criar-conta?voltar=/app/assinar");
  await expect(ctas.last()).toHaveAttribute("href", "/app/criar-conta?voltar=/app/assinar");
  await expect(page.getByRole("link", { name: "Já sou aluno" })).toBeVisible();
});

test("criar conta a partir do CTA termina em /app/assinar (voltar respeitado)", async ({ page }) => {
  await page.goto("/cursos");
  await page.getByRole("link", { name: "Assinar agora" }).first().click();
  await expect(page).toHaveURL(/\/app\/criar-conta\?voltar=/);
  await page.getByLabel("Nome").fill("Aluno Cursos");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  // String (não regex): match exato após resolver contra baseURL. Com regex
  // "/\/app\/assinar$/" esta asserção casava falso-positivo ainda em
  // "/app/criar-conta?voltar=/app/assinar" - a querystring termina com a
  // MESMA substring - e o goto seguinte disparava cedo demais, cancelando o
  // POST de criação de conta antes do cookie de sessão gravar.
  await expect(page).toHaveURL("/app/assinar");
  // Logado e sem acesso, os CTAs apontam direto para a contratação e o
  // atalho "Já sou aluno" some.
  await page.goto("/cursos");
  const ctas = page.getByRole("link", { name: "Assinar agora" });
  await expect(ctas.first()).toHaveAttribute("href", "/app/assinar");
  await expect(ctas.last()).toHaveAttribute("href", "/app/assinar");
  await expect(page.getByRole("link", { name: "Já sou aluno" })).toHaveCount(0);
});
