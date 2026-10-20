import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

/* Credenciais lidas do .env.local, o mesmo arquivo que o `next start` do
   webServer carrega — o teste não pode inventar a senha nem trazê-la no
   código. Se o arquivo não tiver as variáveis, o /admin responde 503 e os
   testes abaixo dizem exatamente isso. */
function credencial(): { usuario: string; senha: string } | null {
  try {
    const env = readFileSync(".env.local", "utf8");
    const usuario = env.match(/^ADMIN_USUARIO=(.*)$/m)?.[1]?.trim();
    const senha = env.match(/^ADMIN_SENHA=(.*)$/m)?.[1]?.trim();
    return usuario && senha ? { usuario, senha } : null;
  } catch {
    return null;
  }
}

const cred = credencial();

/* A asserção que dá sentido ao middleware: o painel mostra nome e e-mail de
   quem se inscreveu, e a exportação entrega a lista inteira. Sem trava, é
   vazamento de dado pessoal — e a trava tem que valer para TODA rota sob
   /admin, não só para a página. */
test("sem credencial, nem a página nem o CSV abrem", async ({ request }) => {
  for (const rota of ["/admin", "/admin/lista-espera.csv", "/admin/cursos"]) {
    const r = await request.get(rota);
    expect(r.status(), `${rota} sem auth`).toBe(401);
    expect(r.headers()["www-authenticate"] ?? "").toContain("Basic");
  }
});

test("credencial errada é recusada", async ({ request }) => {
  const r = await request.get("/admin", {
    headers: { Authorization: "Basic " + Buffer.from("rodrigo:senha-errada").toString("base64") },
  });
  expect(r.status()).toBe(401);
});

test.skip(!cred, "sem ADMIN_USUARIO/ADMIN_SENHA no .env.local");

test("com credencial, o painel abre e mostra as duas seções", async ({ browser }) => {
  const contexto = await browser.newContext({ httpCredentials: { username: cred!.usuario, password: cred!.senha } });
  const page = await contexto.newPage();
  await page.goto("/admin");

  await expect(page.getByRole("heading", { level: 1, name: "Painel" })).toBeVisible();
  /* `exact`: a seção da lista tem "Nos últimos 7 dias", que casaria por
     substring com o rótulo das visitas. */
  await expect(page.getByText("Últimos 7 dias", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lista de espera" })).toBeVisible();
  // A ressalva sobre visitas ≠ visitantes fica na tela, não só no código.
  await expect(page.getByText(/não visitantes únicos/)).toBeVisible();

  await contexto.close();
});

test("o CSV sai como anexo, com ponto e vírgula e cabeçalho", async ({ browser }) => {
  const contexto = await browser.newContext({ httpCredentials: { username: cred!.usuario, password: cred!.senha } });
  const r = await contexto.request.get("/admin/lista-espera.csv");

  expect(r.status()).toBe(200);
  expect(r.headers()["content-disposition"]).toContain("attachment");
  expect(r.headers()["content-type"]).toContain("text/csv");

  const texto = await r.text();
  // BOM primeiro: é o que faz o Excel em português abrir com acento certo.
  expect(texto.charCodeAt(0)).toBe(0xfeff);
  expect(texto).toContain("nome;email;inscricao;consentimento");

  await contexto.close();
});

test("o painel traz o controle de tráfego interno e a seção de origem", async ({ browser }) => {
  const contexto = await browser.newContext({ httpCredentials: { username: cred!.usuario, password: cred!.senha } });
  const page = await contexto.newPage();
  await page.goto("/admin");

  /* O interruptor precisa dizer o estado ANTES de pedir a ação: quem abre o
     painel é da casa, e cada visita dele entra na conta que está prestes a
     ler. */
  await expect(page.getByText("Este navegador", { exact: true })).toBeVisible();
  const botao = page.getByRole("button", { name: /contar este navegador/ });
  await expect(botao).toBeVisible();

  await botao.click();
  await expect(page.getByText("Este navegador não entra na medição.")).toBeVisible();
  /* A marca vive no navegador: sobrevive à recarga, senão não separa nada. */
  await page.reload();
  await expect(page.getByText("Este navegador não entra na medição.")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("iagentics:nao-contar"))).toBe("1");

  await page.getByRole("button", { name: "Voltar a contar este navegador" }).click();
  await expect(page.getByText("Suas visitas estão sendo contadas no painel.")).toBeVisible();

  await expect(page.getByRole("heading", { name: "De onde vêm" })).toBeVisible();
  await contexto.close();
});

test("o painel não é indexável", async ({ browser }) => {
  const contexto = await browser.newContext({ httpCredentials: { username: cred!.usuario, password: cred!.senha } });
  const page = await contexto.newPage();
  await page.goto("/admin");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await contexto.close();
});

/* Painel da plataforma de cursos (2026-10-16): indicadores, funil, gráficos e
   o quadro do fluxo do cliente, numa página própria atrás da mesma senha. */
test("o painel de cursos abre com indicadores, funil, período e as seis etapas do fluxo", async ({ browser }) => {
  const contexto = await browser.newContext({ httpCredentials: { username: cred!.usuario, password: cred!.senha } });
  const page = await contexto.newPage();
  await page.goto("/admin");
  await page.getByRole("link", { name: /Painel da plataforma de cursos/ }).click();
  await expect(page).toHaveURL(/\/admin\/cursos$/);
  await expect(page.getByRole("heading", { level: 1, name: "Plataforma de cursos" })).toBeVisible();
  await expect(page.getByText("Assinantes ativos")).toBeVisible();
  await expect(page.getByText("Receita recorrente mensal")).toBeVisible();
  await expect(page.getByText("Funil do período · 30 dias")).toBeVisible();
  for (const etapa of ["Aguardando pagamento", "Pago · liberar acesso", "Com acesso", "Pagamento atrasado", "Revogar acesso", "Encerradas"]) {
    await expect(page.getByRole("region", { name: etapa })).toBeVisible();
  }
  await page.getByRole("link", { name: "7 dias" }).click();
  await expect(page.getByText("Funil do período · 7 dias")).toBeVisible();
  await contexto.close();
});

/* Filtros e números dos gráficos (2026-10-20): a busca filtra o quadro e a
   tabela, de/até troca o período dos gráficos, e os números de cada dia
   abrem numa tabela. */
test("o painel de cursos filtra o fluxo e mostra os números de cada dia", async ({ browser }) => {
  const contexto = await browser.newContext({ httpCredentials: { username: cred!.usuario, password: cred!.senha } });
  const page = await contexto.newPage();
  await page.goto("/admin/cursos");
  await page.getByLabel("Nome, e-mail ou telefone").fill("ninguem-com-este-nome-xyz");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/q=ninguem-com-este-nome-xyz/);
  await expect(page.getByText(/^0 de \d+ assinaturas com os filtros$/)).toBeVisible();
  await expect(page.locator("table").last().locator("tbody tr")).toHaveCount(0);

  await page.goto("/admin/cursos?de=2026-10-01&ate=2026-10-15");
  await expect(page.getByText("Funil do período · 01/10 a 15/10")).toBeVisible();
  await page.getByText("Ver os números de cada dia").click();
  await expect(page.getByRole("columnheader", { name: "Assinaturas iniciadas" })).toBeVisible();
  await expect(page.locator("details").getByRole("cell", { name: "15/10/2026", exact: true })).toBeVisible();
  await contexto.close();
});
