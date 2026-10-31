import { test, expect, type Page } from "@playwright/test";

/**
 * Diagnose de Compras (/diagnose-compras, 2026-10-31).
 *
 * O envio pelo navegador é INTERCEPTADO: o servidor do e2e lê o
 * RESEND_API_KEY do .env.local, e uma resposta de teste chegaria de verdade à
 * caixa da Academy. A rota em si é testada pelos caminhos que não mandam
 * e-mail (recusa e campo isca); o conteúdo do e-mail, em lib/email.test.ts.
 */

async function identificar(page: Page, papel: "Gestor(a) de Compras" | "Faço parte do time") {
  await page.goto("/diagnose-compras");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("link", { name: "Começar o diagnóstico" }).click();
  await page.getByRole("button", { name: "Começar o diagnóstico" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Quem está respondendo?" })).toBeFocused();
  await page.getByLabel("Nome", { exact: true }).fill("Ana Teste");
  await page.getByLabel("E-mail de trabalho").fill("ana@empresa-teste.com");
  await page.getByLabel(/^Empresa/).fill("Empresa Teste");
  await page.getByLabel("Cargo").fill("Compradora");
  await page.getByText(papel).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Ir para o 1º pilar" }).click();
}

/** Marca a mesma nota em todas as escalas de um tipo ("Como está hoje" etc.) na tela. */
async function marcarTodas(page: Page, tipo: RegExp, nota: number) {
  for (const grupo of await page.getByRole("group", { name: tipo }).all()) {
    await grupo.getByRole("radio", { name: String(nota), exact: true }).check();
  }
}

test("o time responde os 7 pilares, envia e vê a prévia com o radar", async ({ page }) => {
  let corpo: Record<string, unknown> | null = null;
  await page.route("**/api/diagnose", async (route) => {
    corpo = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });

  await identificar(page, "Faço parte do time");
  await expect(page.getByRole("heading", { level: 2, name: "Gestão de Fornecedores" })).toBeVisible();
  // Time não vê potencial nem impacto.
  await expect(page.getByRole("group", { name: /Onde chegar em 12 meses/ })).toHaveCount(0);

  // Avançar sem responder destaca o que falta.
  await page.getByRole("button", { name: "Próximo pilar" }).click();
  await expect(page.locator("p[role=alert]")).toHaveText("Faltam 7 processos, marcados em destaque.");

  for (let pilar = 1; pilar <= 7; pilar++) {
    await marcarTodas(page, /Como está hoje$/, 3);
    await page.getByRole("button", { name: pilar === 7 ? "Enviar e ver a prévia" : "Próximo pilar" }).click();
  }

  await expect(page.getByText("Maturidade média hoje")).toBeVisible();
  await expect(page.getByText("3,0", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Definido" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Radar de maturidade por pilar" })).toBeVisible();
  await expect(page.getByText("Obrigado por responder")).toBeVisible();

  expect(corpo).not.toBeNull();
  expect(corpo!.papel).toBe("time");
  expect(corpo!.consentimento).toBe(true);
  expect(Object.keys(corpo!.respostas as object)).toHaveLength(38);
});

test("o gestor avalia hoje, potencial e impacto, e vê o maior salto", async ({ page }) => {
  await page.route("**/api/diagnose", (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
  await identificar(page, "Gestor(a) de Compras");

  for (let pilar = 1; pilar <= 7; pilar++) {
    await marcarTodas(page, /Como está hoje$/, 2);
    await marcarTodas(page, /Onde chegar em 12 meses$/, pilar === 7 ? 5 : 3);
    await marcarTodas(page, /Impacto no negócio$/, 4);
    if (pilar === 2) {
      // O progresso sobrevive a recarregar a página.
      await page.reload();
      await expect(page.getByRole("heading", { level: 2, name: "Categorias e Strategic Sourcing" })).toBeVisible();
    }
    await page.getByRole("button", { name: pilar === 7 ? "Enviar e ver a prévia" : "Próximo pilar" }).click();
  }

  await expect(page.getByText("As prioridades ficam para a nossa conversa")).toBeVisible();
  await expect(page.getByText(/o maior salto possível está em\s+IA e Dados/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Copiar o link para o time" })).toBeVisible();
});

test("o envio que falha mostra o erro e deixa tentar de novo", async ({ page }) => {
  await page.route("**/api/diagnose", (route) => route.fulfill({ status: 502, body: "{}" }));
  await identificar(page, "Faço parte do time");
  for (let pilar = 1; pilar <= 7; pilar++) {
    await marcarTodas(page, /Como está hoje$/, 4);
    if (pilar < 7) await page.getByRole("button", { name: "Próximo pilar" }).click();
  }
  await page.getByRole("button", { name: "Enviar e ver a prévia" }).click();
  await expect(page.locator("p[role=alert]")).toContainText("Não conseguimos enviar");
  await expect(page.getByRole("button", { name: "Tentar enviar de novo" })).toBeVisible();
});

test("a identificação incompleta diz o que falta", async ({ page }) => {
  await page.goto("/diagnose-compras");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Começar o diagnóstico" }).click();
  await page.getByRole("button", { name: "Ir para o 1º pilar" }).click();
  await expect(page.locator("p[role=alert]")).toHaveText("Falta preencher: nome, e-mail válido, empresa, cargo, seu papel, a autorização.");
});

test("a rota recusa envio incompleto e engole o campo isca sem enviar", async ({ request }) => {
  const recusa = await request.post("/api/diagnose", { data: { nome: "Ana", email: "ana@x.com", empresa: "X", cargo: "Y", papel: "time", consentimento: true, respostas: {} } });
  expect(recusa.status()).toBe(422);
  expect(await recusa.json()).toEqual({ error: "respostas" });

  const isca = await request.post("/api/diagnose", { data: { site: "spam.example" } });
  expect(isca.status()).toBe(200);
});
