import { test, expect, type APIRequestContext } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * Assinatura da Solution na /cursos (2026-10-14): R$ 49,90 por mês, cobrança
 * mensal no Asaas (falso, porta 4010), liberação manual no /admin.
 * Substituiu e2e/catalogo.spec.ts, da venda avulsa da prévia.
 */
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
/* CPF válido diferente a cada execução: o Asaas falso guarda os clientes em
   memória entre testes, e o teste de deduplicação conta clientes. */
function cpfValido(semente: number): string {
  const b = String(100000000 + (semente % 800000000)).padStart(9, "0").split("").map(Number);
  const d1 = ((b.reduce((s, n, i) => s + n * (10 - i), 0) * 10) % 11) % 10;
  const d2 = (([...b, d1].reduce((s, n, i) => s + n * (11 - i), 0) * 10) % 11) % 10;
  return [...b, d1, d2].join("");
}
const dados = (extra: Record<string, unknown> = {}) => ({
  nome: "Assinante E2E",
  email: `e2e-assinatura-${Date.now()}@teste.invalido`,
  telefone: "(11) 98888-7777",
  cpf: cpfValido(Date.now()),
  consentimento: true,
  ...extra,
});
async function estado(request: APIRequestContext) {
  return (await request.get(`${ASAAS_FALSO}/__estado`)).json();
}

test("a /cursos vende a assinatura: preço, CTA, formulário e oferta no JSON-LD", async ({ page }) => {
  await page.goto("/cursos");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("R$ 49,90 por mês");
  await expect(page.getByRole("link", { name: "Assinar por R$ 49,90/mês" })).toHaveAttribute("href", "#assinar");
  await expect(page.getByRole("button", { name: "Ir para o pagamento" })).toBeVisible();
  await expect(page.getByText("Entre na lista de espera")).toHaveCount(0);
  const blocos = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((j) => JSON.parse(j));
  const lista = blocos.find((b) => b["@type"] === "ItemList");
  expect(lista.itemListElement[0].item.offers.price).toBe("49.90");
  expect(blocos.some((b) => b["@type"] === "FAQPage")).toBe(true);
});

test("webhook sem o token certo é recusado", async ({ request }) => {
  expect((await request.post("/api/asaas/webhook", { data: {} })).status()).toBe(401);
  expect((await request.post("/api/asaas/webhook", { data: {}, headers: { "asaas-access-token": "errado" } })).status()).toBe(401);
});

test("o servidor recusa assinatura sem consentimento", async ({ request }) => {
  const r = await request.post("/cursos/assinar", { data: dados({ consentimento: false }) });
  expect(r.status()).toBe(422);
  expect((await r.json()).error).toBe("consentimento");
});

test("valor forjado no corpo é ignorado: a assinatura é de R$ 49,90, mensal, cartão/Pix/boleto", async ({ request }) => {
  const r = await request.post("/cursos/assinar", { data: dados({ value: 0.01, valorCentavos: 1 }) });
  expect(r.status()).toBe(200);
  const a = (await estado(request)).assinaturas.at(-1);
  expect(a.value).toBe(49.9);
  expect(a.cycle).toBe("MONTHLY");
  expect(a.billingType).toBe("UNDEFINED");
});

test("mesmo CPF não cria um segundo cliente no Asaas", async ({ request }) => {
  const cpf = cpfValido(Date.now() + 7);
  await request.post("/cursos/assinar", { data: dados({ cpf }) });
  const antes = (await estado(request)).clientes.length;
  await request.post("/cursos/assinar", { data: dados({ cpf }) });
  expect((await estado(request)).clientes.length).toBe(antes);
});

test("assinatura com id que não existe responde 404", async ({ page }) => {
  const r = await page.goto("/cursos/assinatura/00000000-0000-4000-8000-000000000000");
  expect(r?.status()).toBe(404);
});

test.describe("fluxo completo", () => {
  test.skip(!usuario || !senha || !tokenWebhook, "sem ADMIN_USUARIO/ADMIN_SENHA/ASAAS_WEBHOOK_TOKEN no .env.local");
  test.use({ httpCredentials: { username: usuario ?? "", password: senha ?? "" } });

  test("assina, paga, aparece ativa, é liberada, contestada manda revogar, e cancela", async ({ page, request }) => {
    const nome = `Assinante Completo ${Date.now()}`;
    await page.goto("/cursos");
    await page.getByLabel("Nome completo").fill(nome);
    await page.getByLabel("E-mail", { exact: true }).fill(`e2e-completo-${Date.now()}@teste.invalido`);
    const cpf = cpfValido(Date.now() + 13);
    await page.getByLabel("CPF").fill(cpf);
    await page.getByLabel("Celular com DDD").fill("11988887777");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Ir para o pagamento" }).click();
    await expect(page).toHaveURL(/127\.0\.0\.1:4010\/fatura\//);

    const sub = (await estado(request)).assinaturas.at(-1);
    const id: string = sub.externalReference;
    const evento = (event: string) =>
      request.post("/api/asaas/webhook", {
        headers: { "asaas-access-token": tokenWebhook! },
        data: { event, payment: { id: `pay_${sub.id}_1`, subscription: sub.id, dueDate: sub.nextDueDate } },
      });

    expect((await evento("PAYMENT_RECEIVED")).status()).toBe(200);
    await page.goto(`/cursos/assinatura/${id}`);
    await expect(page.getByRole("status")).toHaveText("Assinatura ativa");

    await page.goto("/admin");
    const linha = () => page.getByRole("row", { name: new RegExp(nome) });
    await linha().getByRole("button", { name: "Marcar acesso liberado" }).click();
    await expect(linha().getByText(/Liberado em/)).toBeVisible();

    // Contestação: o pagamento pode voltar, então o painel manda revogar.
    await evento("PAYMENT_CHARGEBACK_REQUESTED");
    await page.reload();
    await expect(linha().getByText("Contestada")).toBeVisible();
    await expect(linha().getByRole("button", { name: "Marcar acesso revogado" })).toBeVisible();

    const csv = await (await page.request.get("/admin/assinaturas.csv")).text();
    expect(csv).toContain(nome);
    // O CPF foi para o Asaas (falso), e só para ele.
    expect(csv).not.toContain(cpf);
  });

  test("cancelar no /admin para a cobrança no Asaas", async ({ page, request }) => {
    const nome = `Assinante Cancela ${Date.now()}`;
    await request.post("/cursos/assinar", { data: dados({ nome, cpf: cpfValido(Date.now() + 29) }) });
    const sub = (await estado(request)).assinaturas.at(-1);
    await page.goto("/admin");
    const linha = page.getByRole("row", { name: new RegExp(nome) });
    await linha.getByText("Cancelar assinatura").click();
    await linha.getByRole("button", { name: "Confirmar: parar de cobrar" }).click();
    await expect(page.getByRole("row", { name: new RegExp(nome) }).getByText(/Cancelada em/)).toBeVisible();
    expect((await estado(request)).cancelamentos).toContain(sub.id);
  });
});

/* As capas dos cursos da Solution (2026-10-14), tiradas da página pública da
   plataforma e servidas do nosso domínio. */
test("a /cursos mostra os cursos da Solution com capa e nome", async ({ page }) => {
  await page.goto("/cursos");
  const sec = page.getByRole("region", { name: "Cursos na Solution" });
  await expect(sec.getByRole("listitem")).toHaveCount(15);
  // Só cursos do Pecege: o Fundamentos é da IAgentics (fica em "As formações")
  // e os de Excel saíram a pedido do Rodrigo (2026-10-14).
  await expect(sec).not.toContainText("Fundamentos de IA para Negócios");
  await expect(sec).not.toContainText("Excel");
  await expect(sec).toContainText("Inteligência Artificial na Prática");
  const src = await sec.locator("img").first().getAttribute("src");
  expect(src).toContain("solution");
  expect(src).not.toContain("blob.core.windows.net");
});

/* Ordem pedida pelo Rodrigo (2026-10-14): formações da IAgentics antes dos
   cursos do Pecege. */
test("as formações da IAgentics vêm antes dos cursos da Solution", async ({ page }) => {
  await page.goto("/cursos");
  const formacoes = await page.getByRole("heading", { name: "As formações IAgentics", level: 2 }).boundingBox();
  const solution = await page.getByRole("heading", { name: "Cursos na Solution", level: 2 }).boundingBox();
  expect(formacoes!.y).toBeLessThan(solution!.y);
});
