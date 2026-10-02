import { test, expect, type APIRequestContext } from "@playwright/test";
import { readFileSync } from "node:fs";

/* Credenciais e token lidos do .env.local — o mesmo arquivo que o `next
   start` carrega. Nunca no código nem na linha de comando. */
function env(chave: string): string | null {
  try {
    return readFileSync(".env.local", "utf8").match(new RegExp(`^${chave}=(.*)$`, "m"))?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}
const usuario = env("ADMIN_USUARIO");
const senha = env("ADMIN_SENHA");
const tokenWebhook = env("ASAAS_WEBHOOK_TOKEN");

const ASAAS_FALSO = "http://127.0.0.1:4010";
const CPF = "529.982.247-25";
const pedido = (extra: Record<string, unknown> = {}) => ({
  nome: "Compra E2E",
  email: `e2e-catalogo-${Date.now()}@teste.invalido`,
  telefone: "(11) 98888-7777",
  cpf: CPF,
  slugs: ["marketing-com-ia"],
  consentimento: true,
  ...extra,
});

async function ultimaCobranca(request: APIRequestContext) {
  const estado = await (await request.get(`${ASAAS_FALSO}/__estado`)).json();
  return estado.cobrancas.at(-1);
}

/* Sem senha desde 2026-09-22 (pedido do Rodrigo), mas continua escondida:
   abre para qualquer um e diz ao buscador para não indexar. */
test("a prévia abre sem senha e não é indexável", async ({ request }) => {
  const r = await request.get("/preview/catalogo");
  expect(r.status()).toBe(200);
  expect(await r.text()).toMatch(/<meta name="robots" content="noindex/);
  // O checkout também responde sem senha: aqui recusa pela validação, não pela autenticação.
  const c = await request.post("/preview/catalogo/checkout", { data: pedido({ consentimento: false }) });
  expect(c.status()).toBe(422);
});

test("webhook sem o token certo é recusado", async ({ request }) => {
  expect((await request.post("/api/asaas/webhook", { data: {} })).status()).toBe(401);
  expect((await request.post("/api/asaas/webhook", { data: {}, headers: { "asaas-access-token": "errado" } })).status()).toBe(401);
});

/* A credencial ainda é necessária: o fluxo completo termina no /admin. */
test.describe("fluxo de compra", () => {
  test.skip(!usuario || !senha || !tokenWebhook, "sem ADMIN_USUARIO/ADMIN_SENHA/ASAAS_WEBHOOK_TOKEN no .env.local");
  test.use({ httpCredentials: { username: usuario ?? "", password: senha ?? "" } });

  /* Catálogo de dois cursos desde 2026-10-02: Marketing com IA a R$ 59,90 e o
     Fundamentos a R$ 19,90 no lançamento. Sem desconto por quantidade. */
  test("o carrinho soma os preços dos cursos e sobrevive ao recarregar", async ({ page }) => {
    await page.goto("/preview/catalogo");
    await page.evaluate(() => localStorage.removeItem("iagentics:carrinho"));
    await page.reload();

    const barra = page.getByRole("complementary", { name: "Resumo do carrinho" });
    await page.getByRole("button", { name: /^Adicionar Marketing com IA/ }).click();
    await expect(barra).toContainText("1 curso");
    await expect(barra).toContainText(/R\$\s59,90/);

    await page.getByRole("button", { name: /^Adicionar Fundamentos de IA para Negócios/ }).click();
    await expect(barra).toContainText(/R\$\s79,80/);

    await page.reload();
    await expect(barra).toContainText(/R\$\s79,80/);

    await barra.getByRole("button", { name: "Ver carrinho" }).click();
    const gaveta = page.getByRole("dialog", { name: "Seu carrinho" });
    await expect(gaveta.getByTestId("total")).toHaveText(/R\$\s79,80/);
  });

  test("o servidor recusa pedido sem consentimento", async ({ request }) => {
    const r = await request.post("/preview/catalogo/checkout", { data: pedido({ consentimento: false }) });
    expect(r.status()).toBe(422);
    expect((await r.json()).error).toBe("consentimento");
  });

  /* O navegador manda só os slugs: preço forjado no corpo é ignorado, e quem
     decide o valor é o servidor. */
  test("preço forjado no corpo é ignorado", async ({ request }) => {
    const r = await request.post("/preview/catalogo/checkout", {
      data: pedido({ totalCentavos: 1, precoCentavos: 1, value: 0.01 }),
    });
    expect(r.status()).toBe(200);
    expect((await ultimaCobranca(request)).value).toBe(59.9);
  });

  test("compra completa: formulário, fatura, webhook, pedido pago e painel", async ({ page, request }) => {
    await page.goto("/preview/catalogo");
    await page.evaluate(() => localStorage.removeItem("iagentics:carrinho"));
    await page.reload();

    await page.getByRole("button", { name: /^Adicionar Marketing com IA/ }).click();
    await page.getByRole("button", { name: /^Adicionar Fundamentos de IA para Negócios/ }).click();
    await page.getByRole("button", { name: "Ver carrinho" }).click();
    await page.getByRole("button", { name: "Finalizar compra" }).click();

    const nome = `Compra Completa ${Date.now()}`;
    await page.getByLabel("Nome completo").fill(nome);
    await page.getByLabel("E-mail").fill(`e2e-catalogo-${Date.now()}@teste.invalido`);
    await page.getByLabel("CPF").fill(CPF);
    await page.getByLabel("Celular com DDD").fill("11988887777");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Ir para o pagamento" }).click();

    await expect(page).toHaveURL(/127\.0\.0\.1:4010\/fatura\//);
    const cobranca = await ultimaCobranca(request);
    expect(cobranca.value).toBe(79.8);
    expect(cobranca.billingType).toBe("UNDEFINED");
    const idVenda: string = cobranca.externalReference;

    const webhook = await request.post("/api/asaas/webhook", {
      headers: { "asaas-access-token": tokenWebhook! },
      data: { event: "PAYMENT_RECEIVED", payment: { id: cobranca.id, externalReference: idVenda } },
    });
    expect(webhook.status()).toBe(200);

    await page.goto(`/preview/catalogo/pedido/${idVenda}`);
    await expect(page.getByRole("status")).toHaveText("Pagamento confirmado");

    // Preço real desde 2026-10-02: a venda da prévia entra como REAL no painel.
    await page.goto("/admin");
    const linha = page.getByRole("row", { name: new RegExp(nome) });
    await expect(linha).toBeVisible();
    await linha.getByRole("button", { name: "Marcar acesso liberado" }).click();
    await expect(page.getByRole("row", { name: new RegExp(nome) }).getByText(/Liberado em/)).toBeVisible();

    const csv = await (await page.request.get("/admin/vendas.csv?modo=real")).text();
    expect(csv).toContain(nome);
    // O CPF foi para o Asaas (falso), e só para ele.
    expect(csv).not.toMatch(/529\.?982\.?247-?25/);
  });

  test("pedido com id que não existe responde 404", async ({ page }) => {
    const r = await page.goto("/preview/catalogo/pedido/00000000-0000-4000-8000-000000000000");
    expect(r?.status()).toBe(404);
  });
});

/* A hero explica a plataforma e mostra as três marcas da parceria. */
test("a hero traz as três marcas e os quatro passos de como funciona", async ({ page }) => {
  await page.goto("/preview/catalogo");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const alt of ["IAgentics", "Pecege", "Solution"]) await expect(page.getByRole("img", { name: alt }).first()).toBeVisible();
  const passos = page.getByRole("region", { name: "Como funciona" }).getByRole("listitem");
  await expect(passos).toHaveCount(4);
  await expect(passos.nth(2)).toContainText("Receba o acesso");
});

/* O catálogo tem exatamente os dois cursos; o Marketing não tem promoção. */
test("o catálogo mostra os dois cursos com o preço de cada um", async ({ page }) => {
  await page.goto("/preview/catalogo");
  const cards = page.locator("#cursos .vitrine-card");
  await expect(cards).toHaveCount(2);

  const fundamentos = cards.filter({ hasText: "Fundamentos de IA para Negócios" });
  await expect(fundamentos).toContainText("Lançamento");
  await expect(fundamentos.locator("s")).toHaveText(/R\$\s49,90/);
  await expect(fundamentos.getByRole("button", { name: /^Adicionar Fundamentos de IA para Negócios · R\$\s19,90/ })).toBeVisible();

  const marketing = cards.filter({ hasText: "Marketing com IA" });
  await expect(marketing.locator("s")).toHaveCount(0);
  await expect(marketing).not.toContainText("Lançamento");
  await expect(marketing.getByRole("button", { name: /^Adicionar Marketing com IA · R\$\s59,90/ })).toBeVisible();
});

/* Carrinho guardado de quando havia 63 cursos e packs: os slugs que saíram
   são ignorados, sem quebrar a página nem cobrar o que não existe. */
test("carrinho antigo com cursos e packs que saíram é ignorado", async ({ page }) => {
  await page.goto("/preview/catalogo");
  await page.evaluate(() => localStorage.setItem("iagentics:carrinho", JSON.stringify(["coleta-de-dados", "pack-intermediario", "marketing-com-ia"])));
  await page.reload();
  const barra = page.getByRole("complementary", { name: "Resumo do carrinho" });
  await expect(barra).toContainText("1 curso");
  await expect(barra).toContainText(/R\$\s59,90/);
});
