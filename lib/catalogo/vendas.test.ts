import { afterAll, describe, expect, it } from "vitest";
import { like } from "drizzle-orm";
import { db } from "@/lib/db";
import { vendas } from "@/lib/db/schema";
import { aplicarEventoAsaas, anexarCobranca, buscarVenda, criarVenda, marcarAcessoLiberado, marcarFalha } from "./vendas";

const PREFIXO = "vitest-vendas-";

function nova() {
  return criarVenda({
    nome: "Teste Vendas",
    email: `${PREFIXO}${Date.now()}-${Math.random()}@teste.invalido`,
    telefone: "11988887777",
    itens: [{ slug: "a", nome: "Curso A", descontoPct: 0, precoCentavos: 500 }],
    totalCentavos: 500,
    modo: "teste",
  });
}

afterAll(async () => {
  await db.delete(vendas).where(like(vendas.email, `${PREFIXO}%`));
});

describe("vendas", () => {
  it("nasce pendente, com consentimento registrado, e guarda os dados da cobrança", async () => {
    const id = await nova();
    await anexarCobranca(id, { clienteId: "cus_1", cobrancaId: "pay_1", urlFatura: "https://fatura" });
    const v = await buscarVenda(id);
    expect(v?.status).toBe("pendente");
    expect(v?.consentimentoEm).toBeInstanceOf(Date);
    expect(v?.asaasCobrancaId).toBe("pay_1");
    expect(v?.urlFatura).toBe("https://fatura");
  });

  it("buscarVenda devolve null para id que não é uuid, sem consultar", async () => {
    expect(await buscarVenda("nao-e-uuid")).toBeNull();
  });

  it("webhook: pago registra pago_em uma vez só, e evento repetido não tem efeito", async () => {
    const id = await nova();
    const evento = { event: "PAYMENT_RECEIVED", payment: { id: "pay_x", externalReference: id } };
    expect(await aplicarEventoAsaas(evento)).toBe("atualizado");
    const primeiro = (await buscarVenda(id))!.pagoEm;
    expect(await aplicarEventoAsaas(evento)).toBe("sem-efeito");
    expect((await buscarVenda(id))!.pagoEm).toEqual(primeiro);
    expect((await buscarVenda(id))!.status).toBe("pago");
  });

  it("webhook: vencimento atrasado não cancela venda paga", async () => {
    const id = await nova();
    await aplicarEventoAsaas({ event: "PAYMENT_CONFIRMED", payment: { externalReference: id } });
    expect(await aplicarEventoAsaas({ event: "PAYMENT_OVERDUE", payment: { externalReference: id } })).toBe("sem-efeito");
    expect((await buscarVenda(id))!.status).toBe("pago");
  });

  it("webhook: referência desconhecida, ausente ou evento irrelevante é ignorado", async () => {
    expect(await aplicarEventoAsaas({ event: "PAYMENT_RECEIVED", payment: { externalReference: "00000000-0000-4000-8000-000000000000" } })).toBe("sem-efeito");
    expect(await aplicarEventoAsaas({ event: "PAYMENT_RECEIVED", payment: { externalReference: "lixo" } })).toBe("ignorado");
    expect(await aplicarEventoAsaas({ event: "PAYMENT_RECEIVED" })).toBe("ignorado");
    expect(await aplicarEventoAsaas({ event: "PAYMENT_CREATED", payment: { externalReference: await nova() } })).toBe("ignorado");
  });

  it("acesso liberado só vale para venda paga, e uma vez", async () => {
    const id = await nova();
    expect(await marcarAcessoLiberado(id)).toBe(false);
    await aplicarEventoAsaas({ event: "PAYMENT_RECEIVED", payment: { externalReference: id } });
    expect(await marcarAcessoLiberado(id)).toBe(true);
    expect(await marcarAcessoLiberado(id)).toBe(false);
  });

  it("marcarFalha só atinge venda pendente", async () => {
    const id = await nova();
    await marcarFalha(id);
    expect((await buscarVenda(id))!.status).toBe("falhou");
  });
});
