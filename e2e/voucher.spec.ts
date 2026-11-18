import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import pg from "pg";

/**
 * Voucher do preço de fundador do Desafio Prova Real (2026-11-18): a página
 * /cursos/voucher/[codigo], a assinatura de R$ 29,90 no Asaas falso, o uso
 * único e a lista de reajuste do /admin/bolsas. O relógio das bolsas está
 * parado em 24/11/2026 (playwright.config.ts).
 */
function env(chave: string): string | null {
  try {
    return readFileSync(".env.local", "utf8").match(new RegExp(`^${chave}=(.*)$`, "m"))?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}
const ASAAS_FALSO = "http://127.0.0.1:4010";
const cpfValido = (semente: number) => {
  const b = String(100000000 + (semente % 800000000)).padStart(9, "0").split("").map(Number);
  const d1 = ((b.reduce((s, n, i) => s + n * (10 - i), 0) * 10) % 11) % 10;
  const d2 = (([...b, d1].reduce((s, n, i) => s + n * (11 - i), 0) * 10) % 11) % 10;
  return [...b, d1, d2].join("");
};

async function comBanco<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: env("DATABASE_URL") ?? undefined });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

/** Inscrição não selecionada com voucher, direto no banco. */
async function criarVoucher(validoAte: string): Promise<string> {
  const codigo = randomBytes(16).toString("base64url");
  await comBanco((c) =>
    c.query(
      `insert into bolsas_inscricoes (token, nome, email, whatsapp, empresa, problema, regulamento_em, ciencia_dados_em, status, voucher_codigo, voucher_enviado_em, voucher_valido_ate)
       values ($1, 'Voucher E2E', $2, '11988887777', 'Empresa', 'Um problema descrito com calma.', now(), now(), 'nao_selecionado', $3, now(), $4)`,
      [randomBytes(16).toString("base64url"), `e2e-voucher-${Date.now()}-${codigo.slice(0, 4)}@teste.invalido`, codigo, validoAte],
    ),
  );
  return codigo;
}

test("voucher válido: R$ 29,90 por 12 meses, assinatura no Asaas por 29,90 e uso único", async ({ page, request }) => {
  const codigo = await criarVoucher("2026-12-09");
  await page.goto(`/cursos/voucher/${codigo}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("este é o seu voucher");
  await expect(page.getByText("R$ 29,90", { exact: true })).toBeVisible();
  await expect(page.getByText("Válido até 09/12/2026")).toBeVisible();
  const meta = await page.locator('meta[name="robots"]').getAttribute("content");
  expect(meta).toContain("noindex");

  await page.getByLabel("Nome completo").fill("Voucher E2E Silva");
  await page.getByRole("textbox", { name: "E-mail" }).fill(`e2e-voucher-assina-${Date.now()}@teste.invalido`);
  await page.getByRole("textbox", { name: /CPF/ }).fill(cpfValido(Date.now()));
  await page.getByRole("textbox", { name: /Celular/ }).fill("(11) 98888-7777");
  await page.getByRole("checkbox", { name: /Autorizo a cobrança mensal de R\$ 29,90 durante 12 meses/ }).check();
  await page.getByRole("checkbox", { name: /Estou ciente/ }).check();
  await page.getByRole("button", { name: "Usar o voucher e ir para o pagamento" }).click();
  await expect(page.getByRole("heading", { name: "Fatura falsa" })).toBeVisible();

  const estado = await (await request.get(`${ASAAS_FALSO}/__estado`)).json();
  const ultima = estado.assinaturas.at(-1);
  expect(ultima.value).toBe(29.9);
  expect(ultima.cycle).toBe("MONTHLY");

  const linha = await comBanco((c) =>
    c.query(
      `select a.valor_centavos, a.preco_fundador_ate is not null as tem_fim, i.voucher_usado_em is not null as usado
       from assinaturas a join bolsas_inscricoes i on i.id = a.bolsa_inscricao_id where i.voucher_codigo = $1`,
      [codigo],
    ),
  );
  expect(linha.rows).toEqual([{ valor_centavos: 2990, tem_fim: true, usado: true }]);

  // Uso único: a página muda e a rota recusa.
  await page.goto(`/cursos/voucher/${codigo}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Este voucher já foi usado.");
  const de_novo = await request.post("/cursos/voucher/assinar", {
    data: { codigo, nome: "Outra Pessoa", email: "outra@teste.invalido", telefone: "11988887777", cpf: cpfValido(Date.now() + 7), consentimento: true, compartilhamento: true },
  });
  expect(de_novo.status()).toBe(409);
});

test("voucher vencido não assina, e código inexistente é 404", async ({ page, request }) => {
  const codigo = await criarVoucher("2026-11-23");
  await page.goto(`/cursos/voucher/${codigo}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Este voucher venceu.");
  await expect(page.getByRole("button", { name: /Usar o voucher/ })).toHaveCount(0);
  const r = await request.post("/cursos/voucher/assinar", {
    data: { codigo, nome: "Outra Pessoa", email: "outra@teste.invalido", telefone: "11988887777", cpf: cpfValido(Date.now() + 3), consentimento: true, compartilhamento: true },
  });
  expect(r.status()).toBe(409);
  expect((await page.goto("/cursos/voucher/codigoquenaoexiste000"))?.status()).toBe(404);
});

test("o /admin/bolsas lista quem está perto do fim do preço de fundador e reajusta no Asaas", async ({ browser, request }) => {
  const usuario = env("ADMIN_USUARIO");
  const senha = env("ADMIN_SENHA");
  test.skip(!usuario || !senha, "sem ADMIN_USUARIO/ADMIN_SENHA no .env.local");
  const asaasId = `sub_reajuste_${Date.now()}`;
  const email = `e2e-reajuste-${Date.now()}@teste.invalido`;
  await comBanco((c) =>
    c.query(
      `insert into assinaturas (nome, email, telefone, valor_centavos, status, asaas_assinatura_id, preco_fundador_ate)
       values ('Reajuste E2E', $1, '11988887777', 2990, 'ativa', $2, '2026-12-20')`,
      [email, asaasId],
    ),
  );

  const contexto = await browser.newContext({ httpCredentials: { username: usuario!, password: senha! } });
  const page = await contexto.newPage();
  await page.goto("/admin/bolsas");
  await expect(page.getByRole("heading", { name: "Voucher do preço de fundador" })).toBeVisible();
  const linha = page.getByRole("row", { name: new RegExp(email) });
  await expect(linha).toContainText("20/12/2026");
  await linha.getByText("Reajustar para R$ 49,90").click();
  await linha.getByRole("button", { name: "Confirmar o reajuste" }).click();
  await expect(page.getByRole("row", { name: new RegExp(email) })).toHaveCount(0);
  await contexto.close();

  const estado = await (await request.get(`${ASAAS_FALSO}/__estado`)).json();
  expect(estado.reajustes.find((x: { id: string }) => x.id === asaasId)).toMatchObject({ value: 49.9, updatePendingPayments: true });
  const r = await comBanco((c) => c.query("select valor_centavos, preco_fundador_ate from assinaturas where asaas_assinatura_id = $1", [asaasId]));
  expect(r.rows).toEqual([{ valor_centavos: 4990, preco_fundador_ate: null }]);
});
