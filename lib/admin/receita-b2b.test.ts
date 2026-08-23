import { like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { contratos, empresas } from "@/lib/db/schema";
import { receitaB2B } from "./receita-b2b";

const prefixo = `teste-rec-${Date.now()}`;

async function contrato(d: { valor: string; inicioEm: Date; fimEm: Date | null }) {
  const [e] = await db
    .insert(empresas)
    .values({ nome: `${prefixo}-${Math.random().toString(36).slice(2, 8)}` })
    .returning({ id: empresas.id });
  await db.insert(contratos).values({ empresaId: e.id, valor: d.valor, vagas: 5, inicioEm: d.inicioEm, fimEm: d.fimEm });
}

const hoje = new Date();
const mesesAFrente = (n: number) => new Date(hoje.getTime() + n * 30.44 * 24 * 60 * 60 * 1000);
const mesesAtras = (n: number) => new Date(hoje.getTime() - n * 30.44 * 24 * 60 * 60 * 1000);

describe.skipIf(!process.env.DATABASE_URL)("receita B2B para o painel", () => {
  afterAll(async () => {
    await db.delete(empresas).where(like(empresas.nome, `${prefixo}%`));
  });

  it("contrato com vigência entra no MRR amortizado por mês", async () => {
    const antes = await receitaB2B();
    // 12 meses, R$ 12.000 => R$ 1.000/mês
    await contrato({ valor: "12000.00", inicioEm: hoje, fimEm: mesesAFrente(12) });
    const depois = await receitaB2B();
    expect(depois.mrr - antes.mrr).toBeCloseTo(1000, 0);
    expect(depois.contratosComVigencia).toBe(antes.contratosComVigencia + 1);
  });

  /* A asserção que dá sentido ao módulo: contrato sem fim NÃO é recorrente, e
     somá-lo ao MRR infla o número com dinheiro que não volta no mês seguinte. */
  it("contrato SEM vigência fica fora do MRR e é somado à parte", async () => {
    const antes = await receitaB2B();
    await contrato({ valor: "50000.00", inicioEm: hoje, fimEm: null });
    const depois = await receitaB2B();
    expect(depois.mrr).toBeCloseTo(antes.mrr, 5);
    expect(depois.valorSemVigencia - antes.valorSemVigencia).toBeCloseTo(50000, 2);
    expect(depois.contratosSemVigencia).toBe(antes.contratosSemVigencia + 1);
  });

  it("contrato vencido não conta em lugar nenhum", async () => {
    const antes = await receitaB2B();
    await contrato({ valor: "99000.00", inicioEm: mesesAtras(24), fimEm: mesesAtras(12) });
    const depois = await receitaB2B();
    expect(depois.mrr).toBeCloseTo(antes.mrr, 5);
    expect(depois.valorSemVigencia).toBeCloseTo(antes.valorSemVigencia, 2);
  });

  it("contrato que ainda não começou não conta", async () => {
    const antes = await receitaB2B();
    await contrato({ valor: "77000.00", inicioEm: mesesAFrente(2), fimEm: mesesAFrente(14) });
    const depois = await receitaB2B();
    expect(depois.mrr).toBeCloseTo(antes.mrr, 5);
  });

  /* Contrato curtíssimo não pode virar divisor fracionário e explodir o MRR:
     R$ 3.000 em 20 dias entra como R$ 3.000 no mês, não como R$ 4.500. */
  it("contrato de menos de um mês conta como um mês, não fração", async () => {
    const antes = await receitaB2B();
    await contrato({
      valor: "3000.00",
      inicioEm: hoje,
      fimEm: new Date(hoje.getTime() + 20 * 24 * 60 * 60 * 1000),
    });
    const depois = await receitaB2B();
    expect(depois.mrr - antes.mrr).toBeCloseTo(3000, 0);
  });
});
