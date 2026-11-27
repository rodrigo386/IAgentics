import { describe, expect, it } from "vitest";
import {
  ANOS,
  CBS_REFERENCIA,
  IBS_REFERENCIA,
  REDUCOES,
  aliquotasDoAno,
  calcular,
  lerCenario,
  taxaEfetiva,
  validarPedido,
  type Ano,
  type Cenario,
  type Reducao,
} from "./reforma";

const base: Omit<Cenario, "cotacoes"> = { ano: 2033, reducao: 0, compradorCredita: true, cbsRef: 11.3, ibsRef: 18.7, vezesPorAno: null };

describe("alíquotas da transição", () => {
  it("2027 e 2028: CBS menos 0,1 p.p. e IBS de 0,1%", () => {
    expect(aliquotasDoAno(2027)).toEqual({ cbs: 11.2, ibs: 0.1 });
    expect(aliquotasDoAno(2028)).toEqual({ cbs: 11.2, ibs: 0.1 });
  });
  it("2029 a 2032 sobem o IBS em décimos e 2033 é cheio", () => {
    expect(aliquotasDoAno(2029).ibs).toBe(1.87);
    expect(aliquotasDoAno(2032).ibs).toBe(7.48);
    expect(aliquotasDoAno(2033)).toEqual({ cbs: 11.3, ibs: 18.7 });
  });
  it("a redução de alíquota corta a soma", () => {
    expect(taxaEfetiva({ ...base, reducao: 60 })).toBeCloseTo(12);
    expect(taxaEfetiva({ ...base, reducao: 100 })).toBe(0);
  });
});

describe("custo líquido", () => {
  it("regime regular: o crédito é o IBS e a CBS por fora do preço", () => {
    const { resultados } = calcular({ ...base, cotacoes: [{ nome: "A", regime: "regular", valor: 1300, percentualSimples: null }] });
    expect(resultados[0].credito).toBe(300);
    expect(resultados[0].liquido).toBe(1000);
  });

  it("Simples pelo DAS: crédito é o percentual da nota, e o empate é calculado", () => {
    const { resultados } = calcular({
      ...base,
      cotacoes: [
        { nome: "Regular", regime: "regular", valor: 1300, percentualSimples: null },
        { nome: "Simples", regime: "simples_das", valor: 1100, percentualSimples: 5 },
      ],
    });
    const s = resultados[1];
    expect(s.credito).toBe(55);
    expect(s.liquido).toBe(1045);
    expect(s.melhor).toBe(false);
    expect(s.acimaDaMelhor).toBe(45);
    expect(s.empate).toBeCloseTo(1052.63, 2);
  });

  it("sem o percentual do Simples, a conta usa zero e avisa", () => {
    const { resultados } = calcular({ ...base, cotacoes: [{ nome: "S", regime: "simples_das", valor: 500, percentualSimples: null }] });
    expect(resultados[0].credito).toBe(0);
    expect(resultados[0].semPercentual).toBe(true);
  });

  it("comprador sem crédito paga o total da nota em todas", () => {
    const { resultados } = calcular({
      ...base,
      compradorCredita: false,
      cotacoes: [
        { nome: "R", regime: "simples_fora", valor: 1300, percentualSimples: null },
        { nome: "S", regime: "simples_das", valor: 1100, percentualSimples: 5 },
      ],
    });
    expect(resultados.map((r) => r.liquido)).toEqual([1300, 1100]);
    expect(resultados[1].melhor).toBe(true);
  });

  it("diferença no ano multiplica a distância entre a melhor e a pior", () => {
    const r = calcular({
      ...base,
      vezesPorAno: 12,
      cotacoes: [
        { nome: "R", regime: "regular", valor: 1300, percentualSimples: null },
        { nome: "S", regime: "simples_das", valor: 1100, percentualSimples: 5 },
      ],
    });
    expect(r.diferencaAnual).toBe(540);
  });
});

describe("validação do pedido", () => {
  const cenario = { ano: 2033, reducao: 0, cotacoes: [{ regime: "regular", valor: "1.300" }] };
  it("aceita um pedido completo", () => {
    const v = validarPedido({ nome: "Ana", email: "Ana@Empresa.com.br", empresa: "ACME", consentimento: true, cenario: { ...cenario, cotacoes: [{ regime: "regular", valor: 1300 }] } });
    expect(v.ok && v.contato.email).toBe("ana@empresa.com.br");
  });
  it("aceita o pedido sem empresa e grava vazio", () => {
    const v = validarPedido({ nome: "Ana", email: "ana@x.com", consentimento: true, cenario: { ...cenario, cotacoes: [{ regime: "regular", valor: 1300 }] } });
    expect(v.ok && v.contato.empresa).toBe("");
    expect(v.ok && v.contato.nome).toBe("Ana");
  });
  it("recusa sem consentimento, e-mail inválido ou cenário fora da régua", () => {
    expect(validarPedido({ nome: "Ana", email: "ana@x.com", empresa: "ACME", cenario })).toEqual({ ok: false, motivo: "consentimento" });
    expect(validarPedido({ nome: "Ana", email: "ana", empresa: "ACME", consentimento: true, cenario })).toEqual({ ok: false, motivo: "email" });
    expect(lerCenario({ ano: 2026, reducao: 0, cotacoes: [{ regime: "regular", valor: 1 }] })).toBeNull();
    expect(lerCenario({ ano: 2033, reducao: 0, cotacoes: [{ regime: "simples_das", valor: 1, percentualSimples: 140 }] })).toBeNull();
    expect(lerCenario({ ano: 2033, reducao: 0, cotacoes: [] })).toBeNull();
  });
});

describe("textos da página (regras de texto do Rodrigo)", async () => {
  const { reforma } = await import("./content");
  const tudo = JSON.stringify(reforma);
  it("sem travessão e sem os termos proibidos", () => {
    expect(tudo).not.toMatch(/—/);
    for (const termo of ["alavancar", "robust", "de ponta", "divisor de águas", "vale ressaltar", "nesse sentido", "em um mundo cada vez mais"]) {
      expect(tudo.toLowerCase()).not.toContain(termo);
    }
  });
  it("a FAQ cita os mesmos números que a conta usa", async () => {
    const { CBS_REFERENCIA, IBS_REFERENCIA } = await import("./reforma");
    const f = reforma.faq.map((x) => x.resposta).join(" ");
    expect(f).toContain(`${String(CBS_REFERENCIA).replace(".", ",")}%`);
    expect(f).toContain(`${String(IBS_REFERENCIA).replace(".", ",")}%`);
  });
});

/**
 * Conferência contra a calculadora OFICIAL da Receita (scripts/conferir-receita.ts
 * gera lib/reforma-receita.json com a API da Receita rodando na máquina).
 * Para cada ano e redução: a nota do fornecedor no regime regular é a base mais
 * o IBS e a CBS que a Receita calculou; o nosso crédito tem de ser exatamente
 * esse imposto, e o custo líquido, a base.
 */
describe("conferência com a calculadora da Receita Federal", async () => {
  const { casos } = (await import("./reforma-receita.json")).default as {
    casos: { ano: Ano; reducao: Reducao; base: number; cbs: number; ibs: number; vCBS: number; vIBS: number }[];
  };
  it("cobre todos os anos e reduções da calculadora", () => {
    expect(new Set(casos.map((c) => c.ano)).size).toBe(ANOS.length);
    expect(new Set(casos.map((c) => c.reducao)).size).toBe(REDUCOES.length);
  });
  it.each(casos)("$ano, redução $reducao%, base $base: crédito igual ao IBS + CBS da Receita", (c) => {
    // As alíquotas mandadas à Receita são as da nossa tabela; mudou a tabela, gere o arquivo de novo.
    expect(aliquotasDoAno(c.ano)).toEqual({ cbs: c.cbs, ibs: c.ibs });
    const imposto = Math.round((c.vCBS + c.vIBS) * 100) / 100;
    const { resultados } = calcular({
      ano: c.ano,
      reducao: c.reducao,
      compradorCredita: true,
      cbsRef: CBS_REFERENCIA,
      ibsRef: IBS_REFERENCIA,
      vezesPorAno: null,
      cotacoes: [{ nome: "R", regime: "regular", valor: Math.round((c.base + imposto) * 100) / 100, percentualSimples: null }],
    });
    expect(resultados[0].credito).toBe(imposto);
    expect(resultados[0].liquido).toBe(c.base);
  });
});
