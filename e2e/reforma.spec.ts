import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

function env(chave: string): string {
  try {
    return readFileSync(".env.local", "utf8").match(new RegExp(`^${chave}=(.*)$`, "m"))?.[1]?.trim() ?? "";
  } catch {
    return "";
  }
}

/**
 * Calculadora da Reforma Tributária (2026-11-18; oficial desde 2026-11-19). A conta roda no
 * navegador; o pedido por e-mail grava o contato (o e2e sobe sem
 * RESEND_API_KEY, então o e-mail não sai e a tela diz isso).
 */
const ROTA = "/reforma-tributaria-compras";

test("calcula o custo líquido e o empate do fornecedor do Simples", async ({ page }) => {
  await page.goto(ROTA);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/reforma-tributaria-compras$/);
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.some((s) => s.includes('"FAQPage"'))).toBe(true);
  await page.getByLabel("Ano da compra").selectOption("2033");
  const valores = page.getByLabel("Total da nota (R$)");
  await valores.nth(0).fill("1.300,00");
  await valores.nth(1).fill("1100");
  await page.getByLabel("IBS + CBS do Simples na nota (%)").fill("5");
  const resultado = page.getByRole("region", { name: "Resultado" });
  await expect(resultado).toContainText("30%");
  await expect(resultado).toContainText("R$ 1.000,00");
  await expect(resultado).toContainText("R$ 1.045,00");
  await expect(resultado).toContainText("R$ 1.052,63");
  await expect(resultado.getByText("Melhor custo líquido")).toBeVisible();
});

test("pede o comparativo por e-mail e o contato aparece no /admin", async ({ page }) => {
  await page.goto(ROTA);
  await page.getByLabel("Total da nota (R$)").first().fill("500");
  await page.getByRole("button", { name: "Enviar para o meu e-mail" }).click();
  await expect(page.getByText("Escreva o seu nome.")).toBeVisible();
  const email = `reforma.${Date.now()}@teste.com.br`;
  await page.getByLabel("Nome", { exact: true }).fill("Carla Compras");
  await page.getByLabel("E-mail de trabalho").fill(email);
  await page.getByLabel("Empresa", { exact: true }).fill("Indústria Teste");
  await page.getByRole("checkbox", { name: /Quero receber o comparativo/ }).check();
  await page.getByRole("button", { name: "Enviar para o meu e-mail" }).click();
  await expect(page.getByRole("status")).toContainText("Recebemos o seu pedido");

  const usuario = env("ADMIN_USUARIO");
  const senha = env("ADMIN_SENHA");
  test.skip(!usuario || !senha, "sem credenciais do /admin no ambiente");
  const ctx = await page.context().browser()!.newContext({ httpCredentials: { username: usuario, password: senha } });
  const admin = await ctx.newPage();
  await admin.goto("/admin");
  await expect(admin.getByText(email)).toBeVisible();
  const csv = await admin.request.get("/admin/leads-reforma.csv");
  expect(await csv.text()).toContain(email);
  await ctx.close();
});
