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
  await expect(page.getByRole("heading", { name: "Seus direitos" })).toBeVisible();

  /* O compartilhamento com o Pecege é a asserção que mais importa aqui: é ele
     que exige consentimento no formulário, e a LGPD manda declarar com QUEM se
     compartilha ANTES de compartilhar. Se este texto sumir da política, o
     consentimento coletado em /cursos perde o amparo que o sustenta. */
  await expect(page.getByText(/Lista de espera do lançamento/)).toBeVisible();
  await expect(page.getByText(/compartilhados com o Pecege/)).toBeVisible();
  /* A medição de origem entrou em 2026-09-09. A política deste site descreve o
     que o código faz de verdade — e o que ela promete aqui é o recorte: o
     domínio de quem indicou vira categoria e não é gravado. */
  await expect(page.getByText(/De onde você chegou/)).toBeVisible();
  await expect(page.getByText(/nunca o endereço completo nem o termo que você pesquisou/)).toBeVisible();

  /* A compra de cursos entrou em 2026-09-22: a política declara o que é
     gravado e — o ponto que mais importa — que o CPF NÃO fica no site. */
  await expect(page.getByText(/Compra de cursos/)).toBeVisible();
  await expect(page.getByText(/não é gravado no nosso site/)).toBeVisible();

  /* E o que NÃO pode mais estar lá: a plataforma de ensino saiu em 2026-08-28
     e a política declarava senha por meses depois disso. Declarar tratamento
     que não existe é tão errado quanto omitir o que existe — as duas coisas
     fazem o documento deixar de descrever a realidade. (CPF e Asaas voltaram
     à política em 2026-09-22, com a compra de cursos — agora descrevem
     tratamento real, então a asserção de ausência saiu para eles.) */
  await expect(page.getByText(/bcrypt/)).toHaveCount(0);

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
