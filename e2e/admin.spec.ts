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
  for (const rota of ["/admin", "/admin/lista-espera.csv"]) {
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

test("o painel não é indexável", async ({ browser }) => {
  const contexto = await browser.newContext({ httpCredentials: { username: cred!.usuario, password: cred!.senha } });
  const page = await contexto.newPage();
  await page.goto("/admin");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await contexto.close();
});
