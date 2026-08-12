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
function fakeAsaas(
  opts: {
    falhar?: boolean;
    cobrancas?: Array<{ id: string; status: string; invoiceUrl: string; dueDate: string }>;
    assinaturasDoCliente?: Array<{ id: string; status: string }>;
  } = {},
) {
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
    async listarAssinaturasDoCliente() {
      chamadas.push("listarAssinaturasDoCliente");
      if (opts.falhar) throw new Error("asaas 500");
      return opts.assinaturasDoCliente ?? [];
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
    // listarCobrancas da morta devolve [], então cai para o Reuso 2 (sem criarCliente: reusa cus_velho).
    // listarAssinaturasDoCliente (auto-cura de órfã) também devolve [] no fake → sem órfã → cria nova.
    expect(r.ok).toBe(false); // a lista final da nova assinatura também vem do fake vazio → erro genérico
    expect(chamadas).toEqual(["listarCobrancas", "listarAssinaturasDoCliente", "criarAssinatura", "listarCobrancas"]);
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

  // --- Fix round (review da Task 4): Critical 1, Critical 2, Important 1 ---

  it("concorrência: duas chamadas simultâneas pro mesmo usuário criam só 1 assinatura", async () => {
    const userId = await criarAluno("concorrente");
    const { cliente, chamadas } = fakeAsaas();
    const [r1, r2] = await Promise.all([
      iniciarAssinatura(userId, CPF_VALIDO, cliente),
      iniciarAssinatura(userId, CPF_VALIDO, cliente),
    ]);
    // As duas terminam ok — uma cria, a outra reusa a mesma fatura (o lock
    // por userId serializa; a segunda relê a linha pendente já commitada).
    expect(r1).toEqual({ ok: true, url: "https://asaas.example/i/pay_teste_1" });
    expect(r2).toEqual({ ok: true, url: "https://asaas.example/i/pay_teste_1" });
    expect(await db.select().from(subscriptions).where(eq(subscriptions.userId, userId))).toHaveLength(1);
    expect(chamadas.filter((c) => c === "criarAssinatura")).toHaveLength(1);
    expect(chamadas.filter((c) => c === "criarCliente")).toHaveLength(1);
  });

  it("inadimplente com retry: reusa a fatura vencida em aberto, sem criar assinatura nova", async () => {
    const userId = await criarAluno("inadimplente");
    await db.insert(subscriptions).values({ userId, status: "inadimplente", asaasCustomerId: "cus_teste_1", asaasSubscriptionId: "sub_teste_1" });
    const { cliente, chamadas } = fakeAsaas({ cobrancas: [{ id: "pay_venc", status: "OVERDUE", invoiceUrl: "https://asaas.example/i/pay_venc", dueDate: "2026-08-01" }] });
    const r = await iniciarAssinatura(userId, CPF_VALIDO, cliente);
    expect(r).toEqual({ ok: true, url: "https://asaas.example/i/pay_venc" });
    expect(chamadas).toEqual(["listarCobrancas"]);
    expect(await db.select().from(subscriptions).where(eq(subscriptions.userId, userId))).toHaveLength(1); // nada novo
  });

  it("auto-cura de órfã: assinatura ACTIVE sem linha local é achada e vira a linha pendente, sem criar outra", async () => {
    const userId = await criarAluno("orfa");
    // Linha antiga só com o customer (ex.: cancelada) — dá o customerId ao Reuso 2, sem asaasSubscriptionId.
    await db.insert(subscriptions).values({ userId, status: "cancelada", asaasCustomerId: "cus_org" });
    const { cliente, chamadas } = fakeAsaas({
      assinaturasDoCliente: [{ id: "sub_orfa", status: "ACTIVE" }],
      cobrancas: [{ id: "pay_orfa", status: "PENDING", invoiceUrl: "https://asaas.example/i/pay_orfa", dueDate: "2026-08-20" }],
    });
    const r = await iniciarAssinatura(userId, CPF_VALIDO, cliente);
    expect(r).toEqual({ ok: true, url: "https://asaas.example/i/pay_orfa" });
    expect(chamadas).toEqual(["listarAssinaturasDoCliente", "listarCobrancas"]);
    expect(chamadas).not.toContain("criarAssinatura");
    const linhas = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    expect(linhas).toHaveLength(2); // a antiga "cancelada" + a nova "pendente" auto-curada
    expect(linhas.find((l) => l.status === "pendente")).toMatchObject({ asaasCustomerId: "cus_org", asaasSubscriptionId: "sub_orfa" });
  });
});
