import { describe, expect, it } from "vitest";
import { calcularCarrinho, calcularPedido, descontoDaPosicao, formatarReais, PRECO_TESTE_CENTAVOS } from "./preco";

const VALIDOS = ["a", "b", "c", "d", "e", "f", "g", "h"];
const BASE = 20000;

describe("desconto progressivo", () => {
  it("cresce 5% por posição e para em 25%", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(descontoDaPosicao)).toEqual([0, 5, 10, 15, 20, 25, 25, 25]);
  });

  it("com base R$ 200, a tabela é 200, 190, 180, 170, 160, 150, 150", () => {
    const c = calcularCarrinho(VALIDOS.slice(0, 7), VALIDOS, BASE);
    expect(c.itens.map((i) => i.precoCentavos)).toEqual([20000, 19000, 18000, 17000, 16000, 15000, 15000]);
    expect(c.totalCentavos).toBe(120000);
    expect(c.cheioCentavos).toBe(140000);
  });

  it("cinco cursos saem por R$ 900", () => {
    expect(calcularCarrinho(VALIDOS.slice(0, 5), VALIDOS, BASE).totalCentavos).toBe(90000);
  });

  it("preço de teste: R$ 5,00 no primeiro, R$ 3,75 no teto", () => {
    const c = calcularCarrinho(VALIDOS.slice(0, 6), VALIDOS, PRECO_TESTE_CENTAVOS);
    expect(c.itens[0].precoCentavos).toBe(500);
    expect(c.itens[1].precoCentavos).toBe(475);
    expect(c.itens[5].precoCentavos).toBe(375);
  });
});

describe("o servidor não confia na lista que chega", () => {
  it("descarta slug duplicado e inexistente, mantendo a ordem de chegada", () => {
    const c = calcularCarrinho(["b", "b", "x", "a"], VALIDOS, BASE);
    expect(c.itens.map((i) => i.slug)).toEqual(["b", "a"]);
    expect(c.totalCentavos).toBe(39000);
  });

  it("carrinho vazio custa zero e oferece o primeiro curso a preço cheio", () => {
    const c = calcularCarrinho([], VALIDOS, BASE);
    expect(c.totalCentavos).toBe(0);
    expect(c.proximo).toEqual({ descontoPct: 0, precoCentavos: 20000 });
  });
});

describe("gatilho do próximo curso", () => {
  it("diz quanto sai o próximo", () => {
    expect(calcularCarrinho(["a"], ["a", "b", "c"], BASE).proximo).toEqual({ descontoPct: 5, precoCentavos: 19000 });
  });

  it("some quando o catálogo inteiro já está no carrinho", () => {
    expect(calcularCarrinho(["a", "b"], ["a", "b"], BASE).proximo).toBeNull();
  });
});

describe("formatarReais", () => {
  it("formata em real brasileiro", () => {
    // Intl separa "R$" do número com espaço não quebrável.
    expect(formatarReais(19000).replace(/\s/g, " ")).toBe("R$ 190,00");
    expect(formatarReais(375).replace(/\s/g, " ")).toBe("R$ 3,75");
  });
});

describe("packs", () => {
  const CURSOS = [
    { slug: "i1", nivel: 0 },
    { slug: "i2", nivel: 0 },
    { slug: "m1", nivel: 1 },
    { slug: "m2", nivel: 1 },
    { slug: "m3", nivel: 1 },
  ];
  const PACKS = [
    { slug: "pack-0", nivel: 0 },
    { slug: "pack-1", nivel: 1 },
  ];
  const PRECOS = { cursoCentavos: 20000, packCentavos: 9900 };

  it("pack sozinho custa o preço fixo, e o cheio é a soma dos cursos que ele cobre", () => {
    const p = calcularPedido(["pack-1"], CURSOS, PACKS, PRECOS);
    expect(p.totalCentavos).toBe(9900);
    expect(p.packs).toEqual([{ slug: "pack-1", nivel: 1, cursos: 3, precoCentavos: 9900, cheioCentavos: 60000 }]);
    expect(p.itens).toEqual([]);
  });

  /* A regra que protege o cliente: curso avulso do nível do pack sai da
     conta, em vez de ser cobrado de novo. */
  it("pack cobre o nível: o curso avulso do mesmo nível sai da conta", () => {
    const p = calcularPedido(["m1", "pack-1", "m2"], CURSOS, PACKS, PRECOS);
    expect(p.itens).toEqual([]);
    expect(p.totalCentavos).toBe(9900);
  });

  it("pack não entra na escada: o avulso de outro nível começa a preço cheio", () => {
    const p = calcularPedido(["pack-1", "i1", "i2"], CURSOS, PACKS, PRECOS);
    expect(p.itens.map((i) => i.precoCentavos)).toEqual([20000, 19000]);
    expect(p.totalCentavos).toBe(9900 + 39000);
  });

  it("o próximo curso só considera o que o pack não cobre", () => {
    expect(calcularPedido(["pack-1", "i1"], CURSOS, PACKS, PRECOS).proximo).toEqual({ descontoPct: 5, precoCentavos: 19000 });
    expect(calcularPedido(["pack-0", "pack-1"], CURSOS, PACKS, PRECOS).proximo).toBeNull();
  });

  it("pack repetido ou inexistente é descartado", () => {
    const p = calcularPedido(["pack-0", "pack-0", "pack-9"], CURSOS, PACKS, PRECOS);
    expect(p.packs.map((x) => x.slug)).toEqual(["pack-0"]);
    expect(p.totalCentavos).toBe(9900);
  });
});
