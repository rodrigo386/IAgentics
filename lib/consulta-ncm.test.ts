import { describe, expect, it } from "vitest";
import { buscar, caminho, consultar, formatarNcm, MAX_RESULTADOS } from "./consulta-ncm";
import conferencia from "./receita/consulta-receita.json";
import tabela from "./receita/tabela-ncm.json";

describe("consulta de NCM", () => {
  it("formata o código nos níveis da NCM", () => {
    expect(formatarNcm("34011190")).toBe("3401.11.90");
    expect(formatarNcm("340111")).toBe("3401.11");
    expect(formatarNcm("3401")).toBe("3401");
  });

  it("monta a hierarquia do capítulo ao item", () => {
    const c = caminho("34011190").map((n) => n.codigo);
    expect(c[0]).toBe("34");
    expect(c.at(-1)).toBe("34011190");
  });

  it("sabonete de toucador: higiene pessoal, redução de 60%", () => {
    const r = consultar("3401.11.90")!;
    expect(r.tratamentos.map((t) => t.cClassTrib)).toEqual(["200035"]);
    expect(r.tratamentos[0].reducao).toEqual({ cbs: 60, ibs: 60 });
    expect(r.tratamentos[0].anexo).toBe("VIII");
  });

  it("notebook: sem tratamento especial (regra geral)", () => {
    const r = consultar("84713012")!;
    expect(r.tratamentos).toEqual([]);
    expect(r.integral.cClassTrib).toBe("000001");
  });

  it("foie gras sai da cesta básica pela exceção, como na Receita", () => {
    expect(consultar("02074300")!.tratamentos).toEqual([]);
  });

  it("cerveja e cigarro estão sujeitos ao Imposto Seletivo", () => {
    expect(consultar("22030000")!.seletivo.length).toBeGreaterThan(0);
    expect(consultar("24022000")!.seletivo.length).toBeGreaterThan(0);
    expect(consultar("84713012")!.seletivo).toEqual([]);
  });

  it("código inexistente ou incompleto não consulta", () => {
    expect(consultar("99999999")).toBeNull();
    expect(consultar("3401")).toBeNull();
  });

  it("busca por código pega o prefixo, com ou sem pontos", () => {
    const a = buscar("3401.11");
    expect(a.total).toBeGreaterThan(0);
    expect(a.achados.every((x) => x.codigo.startsWith("340111"))).toBe(true);
  });

  it("busca por texto casa o começo da palavra e usa o contexto da posição", () => {
    const sabao = buscar("sabões toucador");
    expect(sabao.achados.map((x) => x.codigo)).toContain("34011190");
    // "cimento" não pode achar "fornecimento" nem "revestimento".
    expect(buscar("cimento").achados.every((x) => /cimento/i.test(caminho(x.codigo).map((n) => n.descricao).join(" ")))).toBe(true);
    expect(buscar("cimento").achados.some((x) => x.codigo.startsWith("2523"))).toBe(true);
  });

  it("limita a lista e conta o total", () => {
    const r = buscar("84");
    expect(r.achados.length).toBe(MAX_RESULTADOS);
    expect(r.total).toBeGreaterThan(MAX_RESULTADOS);
  });
});

/**
 * Conferência com a calculadora OFICIAL da Receita (scripts/conferir-ncm.ts):
 * para cada par NCM e classificação que a tabela liga, a consulta do site tem
 * de aceitar exatamente o que a Receita aceita.
 */
describe("conferência com a calculadora da Receita Federal", () => {
  const pares = (conferencia as unknown as { pares: [string, string, number][] }).pares;
  it("veio da mesma versão da tabela que o site usa", () => {
    expect((conferencia as { versaoBase: string }).versaoBase).toBe((tabela as { versaoBase: string }).versaoBase);
    expect(pares.length).toBeGreaterThan(3000);
  });
  it("aceita e recusa os mesmos pares que a Receita", () => {
    const divergentes = pares.filter(([ncm, classe, aceito]) => {
      const nossa = consultar(ncm)!.tratamentos.some((t) => t.cClassTrib === classe);
      return nossa !== (aceito === 1);
    });
    expect(divergentes).toEqual([]);
  });
});
