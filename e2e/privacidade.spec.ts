import { test, expect } from "@playwright/test";

/**
 * A política de privacidade.
 *
 * Este spec existe porque a URL já tinha histórico: /privacidade era a
 * segunda página mais exibida do domínio no Google e respondia 404 (herança
 * do site antigo). Um 404 aqui não é só página faltando — é o endereço que o
 * buscador oferece a quem procura, e um dever legal do site.
 */
test("a política abre, é alcançável pelo rodapé e traz o que o site coleta", async ({ page }) => {
  await page.goto("/privacidade");

  await expect(page.getByRole("heading", { level: 1, name: "Política de Privacidade" })).toBeVisible();

  // Os pontos que a política PRECISA declarar, porque descrevem tratamento real.
  await expect(page.getByRole("heading", { name: "O que coletamos, e só isso" })).toBeVisible();
  // Aparece duas vezes de propósito (o que guardamos, e como protegemos).
  await expect(page.getByText("hash bcrypt").first()).toBeVisible();
  await expect(page.getByText(/CPF é solicitado/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Seus direitos" })).toBeVisible();

  // Identificação da controladora: sem CNPJ, a política não cumpre seu papel
  // de dizer QUEM responde pelos dados.
  await expect(page.getByText("56.920.339/0001-60")).toBeVisible();
  await expect(page.getByText(/IAgentics LTDA/)).toBeVisible();

  // Canal de e-mail para exercer direitos da LGPD, como link clicável.
  await expect(page.getByRole("link", { name: "contato@iagentics.com.br" })).toHaveAttribute(
    "href",
    "mailto:contato@iagentics.com.br",
  );

  // Chegar até ela a partir de qualquer página.
  await page.goto("/");
  const linkRodape = page.getByRole("link", { name: "Política de Privacidade" });
  await expect(linkRodape).toBeVisible();
  await linkRodape.click();
  await expect(page).toHaveURL(/\/privacidade$/);
});

test("o WhatsApp aparece no contato com o número certo", async ({ page }) => {
  await page.goto("/");
  const zap = page.getByRole("link", { name: "WhatsApp" }).first();
  await expect(zap).toHaveAttribute("href", /wa\.me\/5515998714091/);
});
