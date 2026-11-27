import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/* Nexo Demo (prévia, 2026-11-27). O e2e sobe com RESEND_API_KEY vazio e
   NEXO_DEMO_LIMITE alto (playwright.config.ts): nenhum e-mail sai. */

const ROTA = "/preview/nexo-demo";

const cred = (() => {
  try {
    const env = readFileSync(".env.local", "utf8");
    const usuario = env.match(/^ADMIN_USUARIO=(.*)$/m)?.[1]?.trim();
    const senha = env.match(/^ADMIN_SENHA=(.*)$/m)?.[1]?.trim();
    return usuario && senha ? { usuario, senha } : null;
  } catch {
    return null;
  }
})();

async function entrar(page: Page, empresa: string) {
  await page.goto(ROTA);
  await page.getByLabel("Nome", { exact: true }).fill("Ana Teste Souza");
  await page.getByLabel("E-mail corporativo").fill(`demo-${Date.now()}@exemplo-teste.com`);
  await page.getByLabel("Empresa").fill(empresa);
  await page.getByLabel("Celular, com DDD").fill("(11) 98888-7777");
  await page.getByLabel("LinkedIn").fill("ana-souza-teste");
  await page.getByRole("checkbox", { name: /Estou ciente/ }).check();
  await page.getByRole("button", { name: "Entrar no Nexo Demo" }).click();
  await expect(page.getByText("Passo 1 de 8")).toBeVisible();
}

const guia = (page: Page) => page.locator("[data-guia]");

test("a entrada mostra o cadastro de cinco campos e fica fora do Google", async ({ page }) => {
  await page.goto(ROTA);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Teste o Nexo com as suas mãos.");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("textbox")).toHaveCount(5);
  await expect(page.getByRole("link", { name: "Política de Privacidade" }).first()).toHaveAttribute("href", "/privacidade");
});

test("o processo vai da requisição à ordem de compra, lembra onde parou e aparece no painel", async ({ page, browser }) => {
  const empresa = `Empresa Demo ${Date.now()}`;
  await entrar(page, empresa);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Olá, Ana. Eu sou a MIA.");

  /* Solicitante: a MIA preenche e a RC nasce. */
  await guia(page).click();
  await expect(page.getByRole("button", { name: "Abrir chamado" })).toBeDisabled();
  await page.getByRole("button", { name: "Preencher com a MIA" }).click();
  await expect(page.getByLabel("Resumo da requisição")).toContainText("R$ 72.000,00");
  await page.getByRole("button", { name: "Abrir chamado" }).click();
  await expect(page.getByRole("heading", { name: "RC-DEMO-0001" })).toBeVisible();
  await expect(page.getByText("Passo 2 de 8")).toBeVisible();

  /* Comprador: a análise da MIA. */
  await guia(page).click();
  await page.getByRole("button", { name: "Ver análise" }).click();
  await expect(page.getByText("Relatório de classificação")).toBeVisible();
  await expect(page.getByText(/Valor acima da alçada do gestor/)).toBeVisible();

  /* Gestor: aprova a RC, que vira cotação. */
  await guia(page).click();
  await page.getByRole("button", { name: "Aprovar", exact: true }).click();
  await expect(page.getByText("Passo 4 de 8")).toBeVisible();

  /* Comprador: convites, propostas, mapa, nova rodada e seleção. */
  await guia(page).click();
  await expect(page.getByRole("heading", { name: "RFQ-DEMO-0001" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Enviar 0 convites/ })).toBeDisabled();
  await page.getByRole("button", { name: "Adicionar todos" }).click();
  await page.getByRole("button", { name: "Enviar 4 convites" }).click();
  await expect(page.getByRole("rowheader", { name: "Distribuidora Horizonte" })).toBeVisible();
  await expect(page.getByRole("rowheader")).toHaveCount(3);
  await page.getByRole("button", { name: "Gerar mapa comparativo (IA)" }).click();
  await expect(page.getByRole("heading", { name: "Insights da MIA" })).toBeVisible();
  await expect(page.getByText(/Norte Sul Atacado foi convidado e não respondeu/)).toBeVisible();
  await expect(page.getByRole("row", { name: /Distribuidora Horizonte/ })).toContainText("R$ 6.782,40");
  await page.getByRole("button", { name: "Abrir nova rodada" }).click();
  await expect(page.getByRole("row", { name: /Distribuidora Horizonte/ })).toContainText("R$ 6.646,75");
  await page.getByRole("button", { name: "Ir para a seleção" }).click();
  await expect(page.getByRole("button", { name: "Concluir (enviar para aprovação)" })).toBeDisabled();
  await page.getByRole("radio", { name: "Distribuidora Horizonte" }).check();
  await expect(page.getByText("R$ 5.532,50 (7,7%)")).toBeVisible();
  await page.getByRole("button", { name: "Concluir (enviar para aprovação)" }).click();
  await expect(page.getByText("Passo 7 de 8")).toBeVisible();

  /* Alçada: aprova, a OC nasce e o fecho leva ao time. */
  await guia(page).click();
  await page.getByRole("button", { name: "Aprovar e gerar a OC" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Da requisição à ordem de compra, sem sair do Nexo.");
  await expect(page.getByText("OC-DEMO-0001")).toBeVisible();
  await expect(page.getByRole("link", { name: "Conversar no WhatsApp" })).toHaveAttribute("href", /wa\.me\/5515998714091/);
  await expect(page.getByRole("link", { name: "Enviar uma mensagem" })).toHaveAttribute("href", "/#contato");

  /* Voltou depois: continua dentro, no fim do processo. */
  await page.reload();
  await expect(page.getByText("Passo 8 de 8")).toBeVisible();
  await expect(page.getByText("OC-DEMO-0001")).toBeVisible();

  /* O painel mostra o cadastro com o passo final. */
  test.skip(!cred, "sem ADMIN_USUARIO/ADMIN_SENHA no .env.local");
  const contexto = await browser.newContext({ httpCredentials: { username: cred!.usuario, password: cred!.senha } });
  const painel = await contexto.newPage();
  await expect
    .poll(async () => {
      await painel.goto("/admin/nexo-demo");
      return painel.getByRole("row", { name: new RegExp(empresa) }).innerText();
    })
    .toContain("8/8 · Gerou a OC (concluiu)");
  const csv = await contexto.request.get("/admin/nexo-demo.csv");
  expect(await csv.text()).toContain(empresa);
  await contexto.close();
});

test("sair da demo volta ao cadastro, e o celular mostra o menu em faixa", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await entrar(page, "Empresa Celular");
  await expect(page.getByRole("button", { name: "Cotações e negociação" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Abrir RC" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nova requisição de compras");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Sair da demo" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Teste o Nexo com as suas mãos.");
});

test("o servidor valida o cadastro, o link de acesso e protege o painel", async ({ request }) => {
  const dados = { nome: "Ana Souza", email: `x-${Date.now()}@exemplo-teste.com`, empresa: "Empresa", celular: "11988887777", linkedin: "ana-souza", ciencia: true };
  const semLinkedin = await request.post("/api/nexo-demo", { data: { ...dados, linkedin: "" } });
  expect(semLinkedin.status()).toBe(422);
  expect((await semLinkedin.json()).error).toBe("linkedin");
  expect((await (await request.post("/api/nexo-demo", { data: { ...dados, nome: "" } })).json()).error).toBe("nome");
  expect((await request.post("/api/nexo-demo", { data: { ...dados, ciencia: false } })).status()).toBe(422);

  const { token } = await (await request.post("/api/nexo-demo", { data: dados })).json();
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect((await request.post("/api/nexo-demo/passo", { data: { token, passo: 3 } })).status()).toBe(204);
  expect((await request.post("/api/nexo-demo/passo", { data: { token, passo: 1 } })).status()).toBe(204);
  const volta = await request.post("/api/nexo-demo/entrar", { data: { token } });
  expect(await volta.json()).toEqual({ nome: "Ana Souza", empresa: "Empresa", passo: 3 });
  expect((await request.post("/api/nexo-demo/entrar", { data: { token: "a".repeat(43) } })).status()).toBe(404);

  expect((await request.get("/admin/nexo-demo")).status()).toBe(401);
  expect((await request.get("/admin/nexo-demo.csv")).status()).toBe(401);
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /preview/");
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("nexo-demo");
});

test("o link do e-mail leva de volta para dentro da demo e some do endereço", async ({ page, request }) => {
  const r = await request.post("/api/nexo-demo", { data: { nome: "Bruno Lima", email: `link-${Date.now()}@exemplo-teste.com`, empresa: "Empresa do Link", celular: "11988887777", linkedin: "ana-souza", ciencia: true } });
  const { token } = await r.json();
  await page.goto(`${ROTA}?acesso=${token}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Olá, Bruno. Eu sou a MIA.");
  expect(new URL(page.url()).search).toBe("");
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${ROTA}?acesso=${"b".repeat(43)}`);
  await expect(page.getByText("Este link de acesso não vale mais.")).toBeVisible();
});

test("quem já tem cadastro pede o link pelo e-mail, e a tela não diz quem está na base", async ({ page, request }) => {
  await page.goto(ROTA);
  await page.getByRole("button", { name: "Entrar com o seu e-mail" }).click();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("Já tenho cadastro");
  await expect(page.getByRole("textbox")).toHaveCount(1);
  const email = `ninguem-${Date.now()}@exemplo-teste.com`;
  await page.getByLabel("E-mail do cadastro").fill(email);
  await page.getByRole("button", { name: "Enviar o link de acesso" }).click();
  await expect(page.getByRole("status")).toContainText(`Se ${email} tem cadastro no Nexo Demo`);
  await page.getByRole("button", { name: "Usar outro e-mail" }).click();
  await page.getByRole("button", { name: "Cadastre-se para entrar" }).click();
  await expect(page.getByRole("textbox")).toHaveCount(5);

  /* Mesma resposta para e-mail com e sem cadastro; e-mail inválido é recusado. */
  const cadastrado = `tem-${Date.now()}@exemplo-teste.com`;
  await request.post("/api/nexo-demo", { data: { nome: "Ana Souza", email: cadastrado, empresa: "Empresa", celular: "11988887777", linkedin: "ana-souza", ciencia: true } });
  const com = await request.post("/api/nexo-demo/login", { data: { email: cadastrado } });
  const sem = await request.post("/api/nexo-demo/login", { data: { email } });
  expect(await com.json()).toEqual(await sem.json());
  expect(com.status()).toBe(200);
  expect((await request.post("/api/nexo-demo/login", { data: { email: "ana@" } })).status()).toBe(422);
});
