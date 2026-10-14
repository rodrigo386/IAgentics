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
  compartilhamento: true,
  ...extra,
});
async function estado(request: APIRequestContext) {
  return (await request.get(`${ASAAS_FALSO}/__estado`)).json();
}

test("a /cursos vende a assinatura: preço, CTA e formulário", async ({ page }) => {
  await page.goto("/cursos");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("R$ 49,90 por mês");
  await expect(page.locator("#cta-hero")).toHaveAttribute("href", "#assinar");
  await expect(page.locator("#cta-hero")).toHaveText("Assinar por R$ 49,90/mês");
  await expect(page.getByRole("button", { name: "Ir para o pagamento" })).toBeVisible();
  await expect(page.getByText("Entre na lista de espera")).toHaveCount(0);
  const blocos = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((j) => JSON.parse(j));
  // Sem formação descrita na página, não há Course (nem a oferta dele) no JSON-LD.
  expect(blocos.some((b) => b["@type"] === "ItemList")).toBe(false);
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
  const r2 = await request.post("/cursos/assinar", { data: dados({ compartilhamento: false }) });
  expect((await r2.json()).error).toBe("compartilhamento");
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
    // Dois checkboxes desde 2026-10-14: a cobrança e o compartilhamento com o Pecege.
    await page.getByRole("checkbox", { name: /Autorizo a cobrança/ }).check();
    await page.getByRole("checkbox", { name: /Estou ciente/ }).check();
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

/* A vitrine "Trilhas de Conhecimento" (2026-10-14, pedido do Rodrigo): sete
   trilhas em linhas horizontais, 28 cursos publicados e 18 em breve, todos
   com capa servida do nosso domínio (as em breve e a do Marketing com IA,
   geradas no Remotion). */
test("a /cursos mostra a vitrine da Solution em trilhas", async ({ page }) => {
  await page.goto("/cursos");
  const sec = page.getByRole("region", { name: "Trilhas de Conhecimento" });
  await expect(sec.getByRole("heading", { level: 3 })).toHaveText([
    "IA, Dados & Tecnologia",
    "AI First",
    "Estratégia, Inovação & Projetos",
    "Comunicação & Comportamento",
    "Negociação & Relacionamento",
    "Liderança & Gestão",
    "Compras, Vendas & Supply 4.0",
  ]);
  await expect(sec.getByRole("listitem")).toHaveCount(46);
  await expect(sec.locator("img")).toHaveCount(46);
  await expect(sec.getByRole("img", { name: /, em breve$/ })).toHaveCount(18);
  // O Marketing com IA abre a trilha AI First (pedido do Rodrigo).
  await expect(page.getByRole("list", { name: "AI First" }).getByRole("img").first()).toHaveAccessibleName("Marketing com IA, Prof. Carol");
  // O nome e o professor de cada capa chegam como texto pelo alt.
  await expect(sec.getByRole("img", { name: "Fundamentos de IA para Negócios, Prof. Vinícius Ferreira" })).toBeVisible();
  await expect(sec.getByRole("img", { name: "Inovação, Prof. Léo Recondo" })).toBeAttached();
  await expect(sec).not.toContainText("Excel");
  const src = await sec.locator("img").first().getAttribute("src");
  expect(src).toContain("vitrine");
});

test("as setas da vitrine andam pela trilha", async ({ page }) => {
  await page.goto("/cursos");
  const anteriores = page.getByRole("button", { name: "Ver cursos anteriores: IA, Dados & Tecnologia" });
  const proximos = page.getByRole("button", { name: "Ver próximos cursos: IA, Dados & Tecnologia" });
  const lista = page.getByRole("list", { name: "IA, Dados & Tecnologia" });
  await expect(anteriores).toBeDisabled();
  await proximos.click();
  await expect.poll(() => lista.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await expect(anteriores).toBeEnabled();
});

/* Ordem pedida pelo Rodrigo (2026-10-14): formações da IAgentics antes dos
   cursos do Pecege. */
test("as formações da IAgentics vêm antes dos cursos da Solution", async ({ page }) => {
  await page.goto("/cursos");
  const formacoes = await page.getByRole("heading", { name: "As formações IAgentics", level: 2 }).boundingBox();
  const solution = await page.getByRole("heading", { name: "Trilhas de Conhecimento", level: 2 }).boundingBox();
  expect(formacoes!.y).toBeLessThan(solution!.y);
});

/* O botão de assinar acompanha a rolagem (2026-10-14, pedido do Rodrigo):
   escondido enquanto o da hero está na tela, visível no meio da página,
   escondido de novo quando o formulário aparece. */
test("o botão de assinar acompanha a rolagem e some no formulário", async ({ page }) => {
  await page.goto("/cursos");
  const barra = page.locator("#barra-assinar");
  await expect(barra).toHaveAttribute("inert", "");
  await page.getByRole("heading", { name: "Trilhas de Conhecimento" }).scrollIntoViewIfNeeded();
  await expect(barra).not.toHaveAttribute("inert", "");
  await expect(barra.getByRole("link", { name: "Assinar por R$ 49,90/mês" })).toBeInViewport();
  await page.locator("#assinar").scrollIntoViewIfNeeded();
  await expect(barra).toHaveAttribute("inert", "");
});
