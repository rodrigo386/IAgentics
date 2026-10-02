import { describe, expect, it } from "vitest";
import { calcularCarrinho, formatarReais, PRECO_TESTE_CENTAVOS, precosFixos } from "./preco";

const VALIDOS = ["a", "b", "c", "d", "e", "f", "g", "h"];
const BASE = 20000;

/* A escada de desconto (5% a mais por curso, até 25%) existiu de 2026-09-22 a
   2026-10-02 e saiu a pedido do Rodrigo: cada curso avulso custa o preço
   cheio, quantos estiverem no carrinho. Os testes abaixo travam isso. */
describe("preço do curso avulso", () => {
  it("cada curso custa o preço cheio, sem desconto por quantidade", () => {
    const c = calcularCarrinho(VALIDOS.slice(0, 7), VALIDOS, BASE);
    expect(c.itens.map((i) => i.precoCentavos)).toEqual(Array(7).fill(20000));
    expect(c.itens.every((i) => i.descontoPct === 0)).toBe(true);
    expect(c.totalCentavos).toBe(140000);
    expect(c.cheioCentavos).toBe(140000);
  });

  it("preço de teste: R$ 5,00 em todo curso", () => {
    const c = calcularCarrinho(VALIDOS.slice(0, 6), VALIDOS, PRECO_TESTE_CENTAVOS);
    expect(c.itens.map((i) => i.precoCentavos)).toEqual(Array(6).fill(500));
  });
});

describe("o servidor não confia na lista que chega", () => {
  it("descarta slug duplicado e inexistente, mantendo a ordem de chegada", () => {
    const c = calcularCarrinho(["b", "b", "x", "a"], VALIDOS, BASE);
    expect(c.itens.map((i) => i.slug)).toEqual(["b", "a"]);
    expect(c.totalCentavos).toBe(40000);
  });

  it("carrinho vazio custa zero", () => {
    expect(calcularCarrinho([], VALIDOS, BASE).totalCentavos).toBe(0);
  });
});

describe("formatarReais", () => {
  it("formata em real brasileiro", () => {
    // Intl separa "R$" do número com espaço não quebrável.
    expect(formatarReais(19000).replace(/\s/g, " ")).toBe("R$ 190,00");
    expect(formatarReais(375).replace(/\s/g, " ")).toBe("R$ 3,75");
  });
});

/* Preço próprio de curso (2026-10-02, pedido do Rodrigo): Fundamentos de IA
   para Negócios custa R$ 49,90 e sai por R$ 19,90 no lançamento. */
describe("curso com preço próprio", () => {
  const FIXOS = new Map([["intro", { precoCentavos: 1990, cheioCentavos: 4990 }]]);
  const VALIDOS = ["intro", "a", "b"];

  it("cobra o preço próprio e mostra o cheio dele, não a base", () => {
    const c = calcularCarrinho(["intro"], VALIDOS, 20000, FIXOS);
    expect(c.itens).toEqual([{ slug: "intro", descontoPct: 60, precoCentavos: 1990, cheioCentavos: 4990 }]);
    expect(c.totalCentavos).toBe(1990);
    expect(c.cheioCentavos).toBe(4990);
  });

  it("não mexe no preço dos outros cursos", () => {
    const c = calcularCarrinho(["a", "intro", "b"], VALIDOS, 20000, FIXOS);
    expect(c.itens.map((i) => i.precoCentavos)).toEqual([20000, 1990, 20000]);
  });

  it("na prévia vira R$ 5, mantendo a proporção do riscado", () => {
    const teste = precosFixos([{ slug: "intro", preco: { cheioCentavos: 4990, promoCentavos: 1990 } }, { slug: "a" }], "teste");
    expect(teste.get("intro")).toEqual({ precoCentavos: 500, cheioCentavos: 1254 });
    expect(teste.has("a")).toBe(false);
    const real = precosFixos([{ slug: "intro", preco: { cheioCentavos: 4990, promoCentavos: 1990 } }], "real");
    expect(real.get("intro")).toEqual({ precoCentavos: 1990, cheioCentavos: 4990 });
  });

});
