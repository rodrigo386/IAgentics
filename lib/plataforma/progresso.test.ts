import { describe, it, expect } from "vitest";
import { derivarProgresso, proximaAula } from "./progresso";
import type { Modulo } from "./tipos";

const aula = (id: string, ordem: number): Modulo["aulas"][number] =>
  ({ id, slug: id, titulo: id, descricao: "", duracaoSeg: 60, ordem, gratuita: false });

const modulos: Modulo[] = [
  { id: "m1", titulo: "M1", ordem: 1, aulas: [aula("a1", 1), aula("a2", 2)] },
  { id: "m2", titulo: "M2", ordem: 2, aulas: [aula("a3", 1)] },
];

describe("derivarProgresso", () => {
  it("zero concluídas", () => {
    expect(derivarProgresso(["a1", "a2", "a3"], new Set())).toEqual({ feitas: 0, total: 3, pct: 0 });
  });
  it("parcial arredonda para inteiro", () => {
    expect(derivarProgresso(["a1", "a2", "a3"], new Set(["a1"]))).toEqual({ feitas: 1, total: 3, pct: 33 });
  });
  it("completo", () => {
    expect(derivarProgresso(["a1"], new Set(["a1"])).pct).toBe(100);
  });
  it("catálogo vazio não divide por zero", () => {
    expect(derivarProgresso([], new Set()).pct).toBe(0);
  });
  it("concluída fora do curso não conta", () => {
    expect(derivarProgresso(["a1"], new Set(["x"])).feitas).toBe(0);
  });
});

describe("proximaAula", () => {
  it("nada concluído → primeira aula do primeiro módulo", () => {
    expect(proximaAula(modulos, new Set())?.id).toBe("a1");
  });
  it("pula concluídas e cruza módulos", () => {
    expect(proximaAula(modulos, new Set(["a1", "a2"]))?.id).toBe("a3");
  });
  it("tudo concluído → null", () => {
    expect(proximaAula(modulos, new Set(["a1", "a2", "a3"]))).toBeNull();
  });
});
