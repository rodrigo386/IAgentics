import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { processarEventoAsaas } from "./webhook";
import { POST } from "@/app/api/asaas/webhook/route";

const prefixo = `teste-webhook-${Date.now()}`;

async function alunoComPendente(sufixo: string) {
  const [u] = await db
    .insert(users)
    .values({ nome: `Teste webhook ${sufixo}`, email: `${prefixo}-${sufixo}@teste.invalido`, senhaHash: "x" })
    .returning({ id: users.id });
  const [s] = await db
    .insert(subscriptions)
    .values({ userId: u.id, status: "pendente", asaasCustomerId: "cus_w", asaasSubscriptionId: `sub_${prefixo}_${sufixo}` })
    .returning({ id: subscriptions.id, asaasSubscriptionId: subscriptions.asaasSubscriptionId });
  return s;
}

async function statusDe(id: string) {
  const [l] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
  return l;
}

describe.skipIf(!process.env.DATABASE_URL)("processarEventoAsaas", () => {
  afterAll(async () => {
    await db.delete(users).where(like(users.email, `${prefixo}-%`));
  });

  it("PAYMENT_CONFIRMED ativa e grava current_period_end = vencimento + 1 mês", async () => {
    const s = await alunoComPendente("confirmado");
    await processarEventoAsaas({ event: "PAYMENT_CONFIRMED", payment: { subscription: s.asaasSubscriptionId!, dueDate: "2026-08-14" } });
    const l = await statusDe(s.id);
    expect(l.status).toBe("ativa");
    expect(l.currentPeriodEnd?.toISOString().slice(0, 10)).toBe("2026-09-14");
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

  it("PAYMENT_OVERDUE trava (inadimplente)", async () => {
    const s = await alunoComPendente("vencido");
    await processarEventoAsaas({ event: "PAYMENT_OVERDUE", payment: { subscription: s.asaasSubscriptionId! } });
    expect((await statusDe(s.id)).status).toBe("inadimplente");
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
