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

    const barra = page.getByRole("complementary", { name: "Resumo do carrinho" });
    await page.getByRole("button", { name: /^Adicionar Função Objetivo de Compras/ }).click();
    await expect(barra).toContainText("1 curso");
    await expect(barra).toContainText(/R\$\s5,00/);

    // Sem escada de desconto (saiu em 2026-10-02): o segundo custa o mesmo.
    await page.getByRole("button", { name: /^Adicionar Processos e áreas de atuação/ }).click();
    await expect(barra).toContainText(/R\$\s10,00/);

    await page.reload();
    await expect(barra).toContainText(/R\$\s10,00/);

    await barra.getByRole("button", { name: "Ver carrinho" }).click();
    const gaveta = page.getByRole("dialog", { name: "Seu carrinho" });
    await expect(gaveta.getByTestId("total")).toHaveText(/R\$\s10,00/);
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
    expect(cobranca.value).toBe(10);
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

/* "Monte sua trilha": cinco cliques na gaveta e a trilha vai para o carrinho,
   que abre sozinho em seguida. Roda no navegador, sem senha e sem gravar nada. */
test("o questionário monta a trilha e abre o carrinho com ela", async ({ page }) => {
  await page.goto("/preview/catalogo");
  await page.evaluate(() => localStorage.removeItem("iagentics:carrinho"));
  await page.reload();

  await page.getByRole("button", { name: "Montar minha trilha em 2 minutos" }).click();
  await expect(page.getByText("Pergunta 1 de 5")).toBeVisible();
  for (const o of ["Já opero compras no dia a dia", "Entender os gastos com dados", "Só o foco principal", "Firmar a base do meu nível", "Trilha curta: 3 cursos"]) {
    await page.getByRole("button", { name: o }).click();
  }
  const trilha = page.getByTestId("trilha");
  await expect(trilha.getByRole("listitem")).toHaveCount(3);
  await expect(trilha.getByRole("listitem").first()).toContainText("Fundamentos de IA para Negócios");
  await expect(trilha).toContainText("Coleta de Dados");

  await page.getByRole("button", { name: "Colocar a trilha no carrinho" }).click();
  const gaveta = page.getByRole("dialog", { name: "Seu carrinho" });
  await expect(gaveta).toBeVisible();
  await expect(gaveta.getByTestId("total")).toHaveText(/R\$\s15,00/);
  await expect(page.getByRole("complementary", { name: "Resumo do carrinho" })).toContainText("3 cursos");
});

/* A hero explica a plataforma e mostra as três marcas da parceria. */
test("a hero traz as três marcas e os quatro passos de como funciona", async ({ page }) => {
  await page.goto("/preview/catalogo");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const alt of ["IAgentics", "Pecege", "Solution"]) await expect(page.getByRole("img", { name: alt }).first()).toBeVisible();
  const passos = page.getByRole("region", { name: "Como funciona" }).getByRole("listitem");
  await expect(passos).toHaveCount(4);
  await expect(passos.nth(2)).toContainText("Ou leve um pack inteiro");
});

/* Packs por jornada: o pack cobre o nível inteiro — o curso avulso daquele
   nível vira "No pack" e não é cobrado de novo. */
test("pack no carrinho cobre o nível e bloqueia o avulso do mesmo nível", async ({ page }) => {
  await page.goto("/preview/catalogo");
  await page.evaluate(() => localStorage.removeItem("iagentics:carrinho"));
  await page.reload();

  const barra = page.getByRole("complementary", { name: "Resumo do carrinho" });
  await page.getByRole("button", { name: /^Adicionar Coleta de Dados/ }).first().click();
  await expect(barra).toContainText("1 curso");

  await page.getByRole("button", { name: "Adicionar pack Intermediário" }).click();
  // O avulso intermediário saiu; o pack traz os 22 cursos do nível, a R$ 5 na prévia.
  await expect(barra).toContainText("22 cursos");
  await expect(barra).toContainText(/R\$\s5,00/);
  const avulso = page.getByRole("button", { name: /^Adicionar Coleta de Dados · No pack/ }).first();
  await expect(avulso).toBeDisabled();

  await barra.getByRole("button", { name: "Ver carrinho" }).click();
  const gaveta = page.getByRole("dialog", { name: "Seu carrinho" });
  await expect(gaveta).toContainText("Pack Intermediário");
  await expect(gaveta).toContainText("22 cursos inclusos");
  await expect(gaveta.getByTestId("total")).toHaveText(/R\$\s5,00/);
});

/* No servidor: pack mais curso do mesmo nível custa só o pack, e a venda
   registra o pack com o nome que o Pecege lê no CSV. */
test("o checkout cobra o pack uma vez só, mesmo com curso do nível junto", async ({ request }) => {
  const r = await request.post("/preview/catalogo/checkout", {
    data: pedido({ slugs: ["coleta-de-dados", "pack-intermediario", "saneamento-de-dados"] }),
  });
  expect(r.status()).toBe(200);
  const cobranca = await ultimaCobranca(request);
  expect(cobranca.value).toBe(5);
  expect(cobranca.description).toContain("Pack Intermediário · 22 cursos");
});

/* Preço próprio de lançamento (2026-10-02): o introdutório mostra o preço
   dele, com o cheio riscado e o selo — na prévia, R$ 5,00 e R$ 12,54 (a
   proporção de R$ 19,90 / R$ 49,90). Os outros cursos não mudam de preço. */
test("o curso introdutório mostra o preço de lançamento", async ({ page }) => {
  await page.goto("/preview/catalogo");
  await page.evaluate(() => localStorage.removeItem("iagentics:carrinho"));
  await page.reload();

  const card = page.locator(".vitrine-card", { hasText: "Fundamentos de IA para Negócios" }).first();
  await expect(card).toContainText("Lançamento");
  await expect(card.locator("s")).toHaveText(/R\$\s12,54/);
  await card.getByRole("button", { name: /^Adicionar Fundamentos de IA para Negócios · R\$\s5,00/ }).click();

  const barra = page.getByRole("complementary", { name: "Resumo do carrinho" });
  await expect(barra).toContainText("Você economiza R$");
  await page.getByRole("button", { name: /^Adicionar Função Objetivo de Compras/ }).click();
  await expect(barra).toContainText(/R\$\s10,00/);
});
