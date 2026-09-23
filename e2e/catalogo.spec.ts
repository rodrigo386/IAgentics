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
  slugs: ["fundamentos-ia-negocios"],
  consentimento: true,
  ...extra,
});

async function ultimaCobranca(request: APIRequestContext) {
  const estado = await (await request.get(`${ASAAS_FALSO}/__estado`)).json();
  return estado.cobrancas.at(-1);
}

/* A prévia cobra de verdade: sem senha, nada abre — nem pelo caminho do
   markdown para agentes, que reescreve a rota. Sem ADMIN_USUARIO/ADMIN_SENHA
   no .env.local o middleware falha fechado com 503 em vez de 401 (mesma
   regra do /admin, ver e2e/admin.spec.ts) — pula em vez de afirmar o status
   errado por motivo que não é o código. */
test("sem credencial, a prévia, o checkout e o markdown recusam", async ({ request }) => {
  test.skip(!usuario || !senha, "sem ADMIN_USUARIO/ADMIN_SENHA no .env.local");
  expect((await request.get("/preview/catalogo")).status()).toBe(401);
  expect((await request.get("/preview/catalogo", { headers: { Accept: "text/markdown" } })).status()).toBe(401);
  expect((await request.post("/preview/catalogo/checkout", { data: pedido() })).status()).toBe(401);
});

test("webhook sem o token certo é recusado", async ({ request }) => {
  expect((await request.post("/api/asaas/webhook", { data: {} })).status()).toBe(401);
  expect((await request.post("/api/asaas/webhook", { data: {}, headers: { "asaas-access-token": "errado" } })).status()).toBe(401);
});

test.describe("com credencial", () => {
  test.skip(!usuario || !senha || !tokenWebhook, "sem ADMIN_USUARIO/ADMIN_SENHA/ASAAS_WEBHOOK_TOKEN no .env.local");
  test.use({ httpCredentials: { username: usuario ?? "", password: senha ?? "" } });

  test("o carrinho aplica o desconto progressivo e sobrevive ao recarregar", async ({ page }) => {
    await page.goto("/preview/catalogo");
    await page.evaluate(() => localStorage.removeItem("iagentics:carrinho"));
    await page.reload();

    const total = page.getByTestId("total");
    await page.getByRole("button", { name: /^Adicionar Fundamentos de IA aplicado/ }).click();
    await expect(total).toHaveText(/R\$\s5,00/);
    await expect(page.getByText(/Adicione mais um e ele sai por R\$\s4,75/)).toBeVisible();

    await page.getByRole("button", { name: /^Adicionar Fundamentos de IA com Copilot/ }).click();
    await expect(total).toHaveText(/R\$\s9,75/);

    await page.reload();
    await expect(page.getByTestId("total")).toHaveText(/R\$\s9,75/);

    await page.getByRole("button", { name: /^Remover Fundamentos de IA com Copilot/ }).click();
    await expect(page.getByTestId("total")).toHaveText(/R\$\s5,00/);
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
    expect((await ultimaCobranca(request)).value).toBe(5);
  });

  test("compra completa: formulário, fatura, webhook, pedido pago e painel", async ({ page, request }) => {
    await page.goto("/preview/catalogo");
    await page.evaluate(() => localStorage.removeItem("iagentics:carrinho"));
    await page.reload();

    await page.getByRole("button", { name: /^Adicionar Fundamentos de IA aplicado/ }).click();
    await page.getByRole("button", { name: /^Adicionar Fundamentos de IA com Copilot/ }).click();
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
    expect(cobranca.value).toBe(9.75);
    expect(cobranca.billingType).toBe("UNDEFINED");
    const idVenda: string = cobranca.externalReference;

    const webhook = await request.post("/api/asaas/webhook", {
      headers: { "asaas-access-token": tokenWebhook! },
      data: { event: "PAYMENT_RECEIVED", payment: { id: cobranca.id, externalReference: idVenda } },
    });
    expect(webhook.status()).toBe(200);

    await page.goto(`/preview/catalogo/pedido/${idVenda}`);
    await expect(page.getByRole("status")).toHaveText("Pagamento confirmado");

    await page.goto("/admin?vendas=teste");
    const linha = page.getByRole("row", { name: new RegExp(nome) });
    await expect(linha).toBeVisible();
    await linha.getByRole("button", { name: "Marcar acesso liberado" }).click();
    await expect(page.getByRole("row", { name: new RegExp(nome) }).getByText(/Liberado em/)).toBeVisible();

    const csv = await (await page.request.get("/admin/vendas.csv?modo=teste")).text();
    expect(csv).toContain(nome);
    // O CPF foi para o Asaas (falso), e só para ele.
    expect(csv).not.toMatch(/529\.?982\.?247-?25/);
  });

  test("pedido com id que não existe responde 404", async ({ page }) => {
    const r = await page.goto("/preview/catalogo/pedido/00000000-0000-4000-8000-000000000000");
    expect(r?.status()).toBe(404);
  });
});
