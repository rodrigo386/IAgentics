import { describe, expect, it } from "vitest";
import { avaliada, decidir, elegivel, lerNota, lerSimNao, ordenarPainel, pontuacao } from "./selecao";

const l = (id: string, dia: number, c: number | null, s: number | null, seg: boolean | null, pub: boolean | null) => ({
  id,
  criadaEm: new Date(2026, 10, dia),
  clareza: c,
  solucao30Dias: s,
  seguiuAcademy: seg,
  publicouPost: pub,
});

describe("seleção do Prova Real", () => {
  it("lê notas só de 0 a 10 inteiras", () => {
    expect(lerNota("7")).toBe(7);
    expect(lerNota("0")).toBe(0);
    expect(lerNota("")).toBeNull();
    expect(lerNota("11")).toBeNull();
    expect(lerNota("-1")).toBeNull();
    expect(lerNota("7.5")).toBeNull();
    expect(lerNota("abc")).toBeNull();
    expect(lerNota(null)).toBeNull();
  });

  it("lê sim e não, o resto é não avaliado", () => {
    expect(lerSimNao("sim")).toBe(true);
    expect(lerSimNao("nao")).toBe(false);
    expect(lerSimNao("")).toBeNull();
  });

  it("só pontua com as duas notas e só concorre cumprindo os dois critérios de perfil", () => {
    expect(pontuacao(l("a", 1, 8, null, true, true))).toBeNull();
    expect(pontuacao(l("a", 1, 8, 7, true, true))).toBe(15);
    expect(avaliada(l("a", 1, 8, 7, true, null))).toBe(false);
    expect(elegivel(l("a", 1, 8, 7, true, false))).toBe(false);
    expect(elegivel(l("a", 1, 8, 7, true, true))).toBe(true);
  });

  it("ocupa as vagas pela pontuação, desempata pela inscrição mais antiga e rejeita quem não cumpriu", () => {
    const r = decidir(
      [
        l("alta", 5, 9, 9, true, true),
        l("empate-antigo", 2, 7, 7, true, true),
        l("empate-novo", 3, 7, 7, true, true),
        l("sem-post", 1, 10, 10, true, false),
      ],
      2,
    );
    expect(r.selecionar.sort()).toEqual(["alta", "empate-antigo"]);
    expect(r.naoSelecionar.sort()).toEqual(["empate-novo", "sem-post"]);
  });

  it("não decide quem ainda não foi avaliado por inteiro", () => {
    const r = decidir([l("meia", 1, 9, null, true, true), l("ok", 2, 5, 5, true, true)], 5);
    expect(r.selecionar).toEqual(["ok"]);
    expect(r.naoSelecionar).toEqual([]);
  });

  it("sem vaga restante, ninguém sobe", () => {
    const r = decidir([l("a", 1, 9, 9, true, true)], 0);
    expect(r.selecionar).toEqual([]);
    expect(r.naoSelecionar).toEqual(["a"]);
  });

  it("o painel mostra o ranking primeiro e o resto por data", () => {
    const ordem = ordenarPainel([l("novo", 9, null, null, null, null), l("top", 8, 9, 9, true, true), l("velho", 1, null, null, null, null)]);
    expect(ordem.map((x) => x.id)).toEqual(["top", "velho", "novo"]);
  });
});
