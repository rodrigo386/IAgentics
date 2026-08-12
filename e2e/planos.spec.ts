import { test, expect } from "@playwright/test";

const email = `e2e-planos-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

test("/planos abre sem login: preço, 9 capas e CTA para criar conta com voltar", async ({ page }) => {
  await page.goto("/planos");
  await expect(page.getByText("R$ 39,90")).toBeVisible();
  await expect(page.getByTestId("capa-plano")).toHaveCount(9);
  await expect(page.getByRole("link", { name: "Assinar agora" })).toHaveAttribute(
    "href",
    "/app/criar-conta?voltar=/app/assinar",
  );
});

test("criar conta a partir do CTA termina em /app/assinar (voltar respeitado)", async ({ page }) => {
  await page.goto("/planos");
  await page.getByRole("link", { name: "Assinar agora" }).click();
  await expect(page).toHaveURL(/\/app\/criar-conta\?voltar=/);
  await page.getByLabel("Nome").fill("Aluno Planos");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  // String (não regex): match exato após resolver contra baseURL. Com regex
  // "/\/app\/assinar$/" esta asserção casava falso-positivo ainda em
  // "/app/criar-conta?voltar=/app/assinar" — a querystring termina com a
  // MESMA substring — e o goto("/planos") seguinte disparava cedo demais,
  // cancelando o POST de criação de conta antes do cookie de sessão gravar.
  await expect(page).toHaveURL("/app/assinar");
  // Logado e sem acesso, /planos passa a apontar direto para a contratação.
  await page.goto("/planos");
  await expect(page.getByRole("link", { name: "Assinar agora" })).toHaveAttribute("href", "/app/assinar");
});
