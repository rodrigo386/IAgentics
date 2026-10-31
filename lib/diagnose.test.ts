import { describe, expect, it } from "vitest";
import { diagnose } from "@/lib/content";
import { TOTAL_PROCESSOS, chave, maiorSalto, marcar, nivel, resumir, validarEnvio, type Respostas } from "./diagnose";

const todas = (nota: (pi: number, ii: number) => { h: number; p?: number; i?: number }): Respostas =>
  Object.fromEntries(diagnose.pilares.flatMap((p, pi) => p.processos.map((_, ii) => [chave(pi, ii), nota(pi, ii)])));

const base = { nome: "Ana", email: "ana@empresa.com", empresa: "Empresa X", cargo: "Compradora", whatsapp: "", consentimento: true };

describe("o questionário", () => {
  it("tem 7 pilares e 38 processos, cada um com régua de três frases", () => {
    expect(diagnose.pilares).toHaveLength(7);
    expect(TOTAL_PROCESSOS).toBe(38);
    for (const p of diagnose.pilares) for (const pr of p.processos) expect(pr.regua).toHaveLength(3);
    expect(diagnose.escala).toHaveLength(5);
  });
  it("sem travessão nos textos (regra de texto do site)", () => {
    expect(JSON.stringify(diagnose)).not.toMatch(/[—–]/);
  });
});

describe("marcar", () => {
  it("o potencial nunca fica abaixo de hoje", () => {
    expect(marcar({ h: 2, p: 3 }, "h", 4)).toEqual({ h: 4, p: 4 });
    expect(marcar({ h: 3 }, "p", 2)).toEqual({ h: 3, p: 3 });
    expect(marcar({ h: 3 }, "p", 5)).toEqual({ h: 3, p: 5 });
  });
});

describe("resumir, nivel e maiorSalto", () => {
  it("média por pilar e geral; o nível é a parte inteira da média", () => {
    const r = resumir(todas((pi) => ({ h: pi === 0 ? 1 : 3, p: 4, i: 3 })), "gestor");
    expect(r.pilares[0]).toMatchObject({ hoje: 1, potencial: 4 });
    expect(r.geral).toBeCloseTo((7 * 1 + 31 * 3) / 38);
    expect(nivel(r.geral!).nome).toBe("Repetitivo");
    expect(maiorSalto(r)?.nome).toBe("Gestão de Fornecedores");
  });
  it("time não tem potencial nem maior salto", () => {
    const r = resumir(todas(() => ({ h: 5 })), "time");
    expect(r.pilares.every((p) => p.potencial === null)).toBe(true);
    expect(maiorSalto(r)).toBeNull();
    expect(nivel(5).nome).toBe("Otimizado");
  });
});

describe("validarEnvio", () => {
  it("aceita o time com só o hoje, e descarta chave que não existe", () => {
    const r = validarEnvio({ ...base, papel: "time", respostas: { ...todas(() => ({ h: 2 })), "99-0": { h: 5 } } });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(Object.keys(r.dados.respostas)).toHaveLength(38);
      expect(r.dados.respostas["0-0"]).toEqual({ h: 2 });
    }
  });
  it("gestor precisa de potencial e impacto em todos", () => {
    expect(validarEnvio({ ...base, papel: "gestor", respostas: todas(() => ({ h: 2 })) })).toEqual({ ok: false, motivo: "respostas" });
    expect(validarEnvio({ ...base, papel: "gestor", respostas: todas(() => ({ h: 2, p: 4, i: 5 })) }).ok).toBe(true);
  });
  it("recusa identificação incompleta, sem autorização, nota fora de 1 a 5 ou faltando processo", () => {
    const ok = todas(() => ({ h: 3 }));
    expect(validarEnvio({ ...base, papel: "time", email: "x", respostas: ok })).toEqual({ ok: false, motivo: "email" });
    expect(validarEnvio({ ...base, papel: "time", consentimento: false, respostas: ok })).toEqual({ ok: false, motivo: "consentimento" });
    expect(validarEnvio({ ...base, papel: "chefe", respostas: ok })).toEqual({ ok: false, motivo: "papel" });
    expect(validarEnvio({ ...base, papel: "time", respostas: { ...ok, "0-0": { h: 6 } } }).ok).toBe(false);
    const { ["6-4"]: _, ...semUm } = ok;
    expect(validarEnvio({ ...base, papel: "time", respostas: semUm }).ok).toBe(false);
  });
});
