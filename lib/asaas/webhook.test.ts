import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { processarEventoAsaas } from "./webhook";
import { POST } from "@/app/api/asaas/webhook/route";

const prefixo = `teste-webhook-${Date.now()}`;

/* Caixa de e-mail em arquivo: EMAIL_CAIXA_TESTE tem precedência sobre a chave
   do Resend em enviarEmail(), então NADA sai para a rede aqui mesmo que a
   RESEND_API_KEY esteja no ambiente por engano. É o que permite testar o aviso
   de inadimplência sem mandar e-mail para @teste.invalido. */
const caixa = join(tmpdir(), `${prefixo}-caixa.jsonl`);

function mensagensNaCaixa(): { para: string; assunto: string; texto: string }[] {
  try {
    return readFileSync(caixa, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l));
  } catch {
    return []; // arquivo nem existe = nenhum e-mail saiu
  }
}

function mensagensPara(email: string) {
  return mensagensNaCaixa().filter((m) => m.para === email);
}

async function alunoComPendente(sufixo: string) {
  const email = `${prefixo}-${sufixo}@teste.invalido`;
  const [u] = await db
    .insert(users)
    .values({ nome: `Teste webhook ${sufixo}`, email, senhaHash: "x" })
    .returning({ id: users.id });
  const [s] = await db
    .insert(subscriptions)
    .values({ userId: u.id, status: "pendente", asaasCustomerId: "cus_w", asaasSubscriptionId: `sub_${prefixo}_${sufixo}` })
    .returning({ id: subscriptions.id, asaasSubscriptionId: subscriptions.asaasSubscriptionId });
  return { ...s, email };
}

async function statusDe(id: string) {
  const [l] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
  return l;
}

describe.skipIf(!process.env.DATABASE_URL)("processarEventoAsaas", () => {
  const caixaOriginal = process.env.EMAIL_CAIXA_TESTE;
  beforeAll(() => {
    process.env.EMAIL_CAIXA_TESTE = caixa;
  });

  afterAll(async () => {
    if (caixaOriginal === undefined) delete process.env.EMAIL_CAIXA_TESTE;
    else process.env.EMAIL_CAIXA_TESTE = caixaOriginal;
    rmSync(caixa, { force: true });
    await db.delete(users).where(like(users.email, `${prefixo}-%`));
  });

  it("PAYMENT_CONFIRMED ativa e grava current_period_end = vencimento + 1 mês", async () => {
    const s = await alunoComPendente("confirmado");
    await processarEventoAsaas({ event: "PAYMENT_CONFIRMED", payment: { subscription: s.asaasSubscriptionId!, dueDate: "2026-08-14" } });
    const l = await statusDe(s.id);
    expect(l.status).toBe("ativa");
    expect(l.currentPeriodEnd?.toISOString().slice(0, 10)).toBe("2026-09-14");
  });

  it("dueDate 31/01 trava em 28/02 (fevereiro não tem dia 31)", async () => {
    const s = await alunoComPendente("fim-jan");
    await processarEventoAsaas({ event: "PAYMENT_CONFIRMED", payment: { subscription: s.asaasSubscriptionId!, dueDate: "2026-01-31" } });
    const l = await statusDe(s.id);
    expect(l.currentPeriodEnd?.toISOString().slice(0, 10)).toBe("2026-02-28");
  });

  it("dueDate 31/12 não encolhe (janeiro seguinte também tem dia 31)", async () => {
    const s = await alunoComPendente("fim-dez");
    await processarEventoAsaas({ event: "PAYMENT_CONFIRMED", payment: { subscription: s.asaasSubscriptionId!, dueDate: "2026-12-31" } });
    const l = await statusDe(s.id);
    expect(l.currentPeriodEnd?.toISOString().slice(0, 10)).toBe("2027-01-31");
  });

  it("replay do mesmo evento é no-op (continua ativa, mesmo period end)", async () => {
    const s = await alunoComPendente("replay");
    const evento = { event: "PAYMENT_RECEIVED", payment: { subscription: s.asaasSubscriptionId!, dueDate: "2026-08-14" } };
    await processarEventoAsaas(evento);
    await processarEventoAsaas(evento);
    const l = await statusDe(s.id);
    expect(l.status).toBe("ativa");
    expect(l.currentPeriodEnd?.toISOString().slice(0, 10)).toBe("2026-09-14");
  });

  it("PAYMENT_OVERDUE trava (inadimplente) e avisa o aluno", async () => {
    const s = await alunoComPendente("vencido");
    await processarEventoAsaas({ event: "PAYMENT_OVERDUE", payment: { subscription: s.asaasSubscriptionId! } });
    expect((await statusDe(s.id)).status).toBe("inadimplente");

    const enviados = mensagensPara(s.email);
    expect(enviados).toHaveLength(1);
    expect(enviados[0].assunto).toContain("cobrança");
    // Sem invoiceUrl no evento, o caminho de volta é /app/assinar — que
    // reaproveita a cobrança em aberto em vez de criar assinatura nova.
    expect(enviados[0].texto).toContain("/app/assinar");
  });

  /* A asserção que dá sentido à mudança: o Asaas REENTREGA evento. Sem a
     cláusula `ne(status,'inadimplente')` no UPDATE, cada reentrega mandaria
     mais um e-mail dizendo ao aluno que ele está devendo — a forma mais
     rápida de transformar uma falha de cartão em cancelamento. */
  it("reentrega do PAYMENT_OVERDUE não manda um segundo e-mail", async () => {
    const s = await alunoComPendente("vencido-replay");
    const evento = { event: "PAYMENT_OVERDUE", payment: { subscription: s.asaasSubscriptionId! } };
    await processarEventoAsaas(evento);
    await processarEventoAsaas(evento);
    await processarEventoAsaas(evento);

    expect((await statusDe(s.id)).status).toBe("inadimplente");
    expect(mensagensPara(s.email)).toHaveLength(1);
  });

  it("invoiceUrl do evento vai no e-mail, poupando um clique", async () => {
    const s = await alunoComPendente("vencido-fatura");
    await processarEventoAsaas({
      event: "PAYMENT_OVERDUE",
      payment: { subscription: s.asaasSubscriptionId!, invoiceUrl: "https://www.asaas.com/i/abc123" },
    });
    expect(mensagensPara(s.email)[0].texto).toContain("https://www.asaas.com/i/abc123");
  });

  /* Vencer de novo DEPOIS de ter regularizado é evento novo, não reentrega:
     o aluno voltou a ficar ativo no meio, então merece ser avisado outra vez. */
  it("vencer de novo após regularizar avisa de novo", async () => {
    const s = await alunoComPendente("vencido-duas-vezes");
    const vencido = { event: "PAYMENT_OVERDUE", payment: { subscription: s.asaasSubscriptionId! } };
    await processarEventoAsaas(vencido);
    await processarEventoAsaas({ event: "PAYMENT_CONFIRMED", payment: { subscription: s.asaasSubscriptionId!, dueDate: "2026-08-14" } });
    await processarEventoAsaas(vencido);

    expect(mensagensPara(s.email)).toHaveLength(2);
  });

  it("PAYMENT_REFUNDED cancela", async () => {
    const s = await alunoComPendente("estornado");
    await processarEventoAsaas({ event: "PAYMENT_REFUNDED", payment: { subscription: s.asaasSubscriptionId! } });
    expect((await statusDe(s.id)).status).toBe("cancelada");
  });

  it("assinatura desconhecida e evento sem subscription: no-op silencioso", async () => {
    await processarEventoAsaas({ event: "PAYMENT_CONFIRMED", payment: { subscription: "sub_que_nao_existe", dueDate: "2026-08-14" } });
    await processarEventoAsaas({ event: "PAYMENT_CONFIRMED", payment: {} });
    await processarEventoAsaas({ event: "PAYMENT_CONFIRMED" });
    // chegar aqui sem lançar É o teste
  });
});

describe("rota POST /api/asaas/webhook", () => {
  it("token errado ou ausente → 401; token certo com evento ignorável → 200", async () => {
    process.env.ASAAS_WEBHOOK_TOKEN = "token-de-teste";
    const corpo = JSON.stringify({ event: "PAYMENT_CREATED", payment: {} });

    const semToken = await POST(new Request("http://local/api/asaas/webhook", { method: "POST", body: corpo }));
    expect(semToken.status).toBe(401);

    const tokenErrado = await POST(
      new Request("http://local/api/asaas/webhook", { method: "POST", headers: { "asaas-access-token": "outro" }, body: corpo }),
    );
    expect(tokenErrado.status).toBe(401);

    const ok = await POST(
      new Request("http://local/api/asaas/webhook", { method: "POST", headers: { "asaas-access-token": "token-de-teste" }, body: corpo }),
    );
    expect(ok.status).toBe(200);
  });
});
