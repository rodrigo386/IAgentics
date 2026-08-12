import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { plataforma } from "@/lib/content-plataforma";
import type { ClienteAsaas } from "./cliente";
import { iniciarAssinatura } from "./assinatura";

const prefixo = `teste-asaas-${Date.now()}`;
const CPF_VALIDO = "529.982.247-25";

/** Fake do contrato ClienteAsaas: registra chamadas, devolve IDs/URLs fixos.
 *  `falhar: true` simula a API fora do ar (toda chamada lança). */
function fakeAsaas(opts: { falhar?: boolean; cobrancas?: Array<{ id: string; status: string; invoiceUrl: string; dueDate: string }> } = {}) {
  const chamadas: string[] = [];
  const cliente: ClienteAsaas = {
    async criarCliente() {
      chamadas.push("criarCliente");
      if (opts.falhar) throw new Error("asaas 500");
      return { id: "cus_teste_1" };
    },
    async criarAssinatura() {
      chamadas.push("criarAssinatura");
      if (opts.falhar) throw new Error("asaas 500");
      return { id: "sub_teste_1" };
    },
    async listarCobrancas() {
      chamadas.push("listarCobrancas");
      if (opts.falhar) throw new Error("asaas 500");
      return opts.cobrancas ?? [{ id: "pay_teste_1", status: "PENDING", invoiceUrl: "https://asaas.example/i/pay_teste_1", dueDate: "2026-08-14" }];
    },
  };
  return { cliente, chamadas };
}

async function criarAluno(sufixo: string): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({ nome: `Teste assinar ${sufixo}`, email: `${prefixo}-${sufixo}@teste.invalido`, senhaHash: "x" })
    .returning({ id: users.id });
  return u.id;
}

describe.skipIf(!process.env.DATABASE_URL)("iniciarAssinatura", () => {
  afterAll(async () => {
    await db.delete(users).where(like(users.email, `${prefixo}-%`)); // subscriptions caem por cascade
  });

  it("CPF inválido: recusa antes de qualquer chamada e não insere linha", async () => {
    const userId = await criarAluno("cpf");
    const { cliente, chamadas } = fakeAsaas();
    const r = await iniciarAssinatura(userId, "111.111.111-11", cliente);
    expect(r).toEqual({ ok: false, erro: plataforma.assinar.cpfInvalido });
    expect(chamadas).toEqual([]);
    expect(await db.select().from(subscriptions).where(eq(subscriptions.userId, userId))).toHaveLength(0);
  });

  it("fluxo feliz: cria cliente + assinatura, insere linha pendente com os IDs, devolve invoiceUrl", async () => {
    const userId = await criarAluno("feliz");
    const { cliente, chamadas } = fakeAsaas();
    const r = await iniciarAssinatura(userId, CPF_VALIDO, cliente);
    expect(r).toEqual({ ok: true, url: "https://asaas.example/i/pay_teste_1" });
    expect(chamadas).toEqual(["criarCliente", "criarAssinatura", "listarCobrancas"]);
    const { eq } = await import("drizzle-orm");
    const linhas = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatchObject({ status: "pendente", asaasCustomerId: "cus_teste_1", asaasSubscriptionId: "sub_teste_1" });
  });

  it("reuso: última linha pendente → volta a MESMA fatura aberta, sem criar nada novo", async () => {
    const userId = await criarAluno("reuso");
    await db.insert(subscriptions).values({ userId, status: "pendente", asaasCustomerId: "cus_teste_1", asaasSubscriptionId: "sub_teste_1" });
    const { cliente, chamadas } = fakeAsaas({ cobrancas: [{ id: "pay_aberta", status: "OVERDUE", invoiceUrl: "https://asaas.example/i/pay_aberta", dueDate: "2026-08-10" }] });
    const r = await iniciarAssinatura(userId, CPF_VALIDO, cliente);
    expect(r).toEqual({ ok: true, url: "https://asaas.example/i/pay_aberta" });
    expect(chamadas).toEqual(["listarCobrancas"]);
    expect(await db.select().from(subscriptions).where(eq(subscriptions.userId, userId))).toHaveLength(1); // nada novo
  });

  it("pendente morta no Asaas (sem cobrança aberta): cria assinatura nova reusando o customer", async () => {
    const userId = await criarAluno("morta");
    await db.insert(subscriptions).values({ userId, status: "pendente", asaasCustomerId: "cus_velho", asaasSubscriptionId: "sub_morta", createdAt: new Date("2020-01-01T00:00:00Z") });
    const { cliente, chamadas } = fakeAsaas({ cobrancas: [] });
    const r = await iniciarAssinatura(userId, CPF_VALIDO, cliente);
    // listarCobrancas da morta devolve [], então cai para criar nova (sem criarCliente: reusa cus_velho)
    expect(r.ok).toBe(false); // a lista final da nova assinatura também vem do fake vazio → erro genérico
    expect(chamadas).toEqual(["listarCobrancas", "criarAssinatura", "listarCobrancas"]);
  });

  it("já assinante (manual): recusa sem chamar o Asaas", async () => {
    const userId = await criarAluno("assinante");
    await db.insert(subscriptions).values({ userId, status: "manual" });
    const { cliente, chamadas } = fakeAsaas();
    const r = await iniciarAssinatura(userId, CPF_VALIDO, cliente);
    expect(r).toEqual({ ok: false, erro: plataforma.assinar.jaAssinante });
    expect(chamadas).toEqual([]);
  });

  it("falha da API: erro genérico e nenhuma linha inserida", async () => {
    const userId = await criarAluno("falha");
    const { cliente } = fakeAsaas({ falhar: true });
    const r = await iniciarAssinatura(userId, CPF_VALIDO, cliente);
    expect(r).toEqual({ ok: false, erro: plataforma.assinar.erroGenerico });
    expect(await db.select().from(subscriptions).where(eq(subscriptions.userId, userId))).toHaveLength(0);
  });
});
