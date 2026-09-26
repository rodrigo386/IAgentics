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
  slugs: ["funcao-objetivo-de-compras"],
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

  test("o carrinho aplica o desconto progressivo e sobrevive ao recarregar", async ({ page }) => {
    await page.goto("/preview/catalogo");
    await page.evaluate(() => localStorage.removeItem("iagentics:carrinho"));
    await page.reload();

    const total = page.getByTestId("total");
    await page.getByRole("button", { name: /^Adicionar Função Objetivo de Compras/ }).click();
    await expect(total).toHaveText(/R\$\s5,00/);
    await expect(page.getByText(/Adicione mais um e ele sai por R\$\s4,75/)).toBeVisible();

    await page.getByRole("button", { name: /^Adicionar Processos e áreas de atuação/ }).click();
    await expect(total).toHaveText(/R\$\s9,75/);

    await page.reload();
    await expect(page.getByTestId("total")).toHaveText(/R\$\s9,75/);

    await page.getByRole("button", { name: /^Remover Processos e áreas de atuação/ }).click();
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

    await page.getByRole("button", { name: /^Adicionar Função Objetivo de Compras/ }).click();
    await page.getByRole("button", { name: /^Adicionar Processos e áreas de atuação/ }).click();
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

/* "Monte sua trilha": cinco cliques e a trilha vai para o carrinho. Roda no
   navegador, sem senha e sem gravar nada. As respostas abaixo pedem uma trilha
   curta de Intermediário com foco em dados. */
test("o questionário monta a trilha e ela entra no carrinho", async ({ page }) => {
  await page.goto("/preview/catalogo");
  await page.evaluate(() => localStorage.removeItem("iagentics:carrinho"));
  await page.reload();

  await page.getByRole("button", { name: "Montar minha trilha" }).click();
  await expect(page.getByText("Pergunta 1 de 5")).toBeVisible();
  await page.getByRole("button", { name: "Já opero compras no dia a dia" }).click();
  await page.getByRole("button", { name: "Entender os gastos com dados" }).click();
  await page.getByRole("button", { name: "Só o foco principal" }).click();
  await page.getByRole("button", { name: "Firmar a base do meu nível" }).click();
  await page.getByRole("button", { name: "Trilha curta: 3 cursos" }).click();

  const trilha = page.getByTestId("trilha");
  await expect(trilha.getByRole("listitem")).toHaveCount(3);
  // Toda trilha abre pelo curso introdutório.
  await expect(trilha.getByRole("listitem").first()).toContainText("Fundamentos de IA aplicado aos Negócios");
  await expect(trilha).toContainText("Coleta de Dados");
  // Três cursos: 5,00 + 4,75 + 4,50 no preço de teste.
  await expect(page.getByText(/R\$\s14,25/)).toBeVisible();

  await page.getByRole("button", { name: "Colocar a trilha no carrinho" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Trilha no carrinho" })).toBeVisible();
  await expect(page.getByTestId("total")).toHaveText(/R\$\s14,25/);
  await expect(page.getByRole("button", { name: /^Remover Coleta de Dados/ })).toBeVisible();
});

test("o filtro por nível mostra só os cursos daquele nível", async ({ page }) => {
  await page.goto("/preview/catalogo");
  await page.getByRole("button", { name: "Avançado", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(10);
  await page.getByRole("button", { name: "Todos", exact: true }).click();
  // 62 da lista do Pecege + o introdutório.
  await expect(page.getByRole("article")).toHaveCount(63);
});
