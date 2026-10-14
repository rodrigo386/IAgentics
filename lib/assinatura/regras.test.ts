import { describe, expect, it } from "vitest";
import { acaoDoAdmin, pagoAteDaFatura, transicaoAssinatura, validarAssinatura } from "./regras";
import { permitir } from "./limite";

const ok = { nome: "Ana Silva", email: "Ana@Empresa.com.br", telefone: "(11) 98888-7777", cpf: "529.982.247-25", consentimento: true };

describe("validarAssinatura", () => {
  it("aceita e normaliza", () => {
    const r = validarAssinatura(ok);
    expect(r).toEqual({ ok: true, dados: { nome: "Ana Silva", email: "ana@empresa.com.br", telefone: "11988887777", cpf: "52998224725" } });
  });
  it("exige consentimento de verdade", () => {
    expect(validarAssinatura({ ...ok, consentimento: "true" })).toEqual({ ok: false, motivo: "consentimento" });
  });
  it("recusa CPF inválido", () => {
    expect(validarAssinatura({ ...ok, cpf: "111.111.111-11" })).toEqual({ ok: false, motivo: "cpf" });
  });
});

describe("transicaoAssinatura", () => {
  it("pagamento ativa e recupera atrasada, mas não reabre cancelada", () => {
    const t = transicaoAssinatura("PAYMENT_RECEIVED")!;
    expect(t.para).toBe("ativa");
    expect(t.de).toContain("atrasada");
    expect(t.de).not.toContain("cancelada");
  });
  it("contestação e estorno viram status próprios", () => {
    expect(transicaoAssinatura("PAYMENT_CHARGEBACK_REQUESTED")?.para).toBe("contestada");
    expect(transicaoAssinatura("PAYMENT_REFUNDED")?.para).toBe("estornada");
  });
  it("ignora evento que não interessa", () => {
    expect(transicaoAssinatura("PAYMENT_CREATED")).toBeNull();
  });
});

describe("pagoAteDaFatura", () => {
  it("vai ao mesmo dia do mês seguinte", () => {
    expect(pagoAteDaFatura("2026-10-14")).toBe("2026-11-14");
    expect(pagoAteDaFatura("2026-12-20")).toBe("2027-01-20");
  });
  it("não pula para março no fim de janeiro", () => {
    expect(pagoAteDaFatura("2027-01-31")).toBe("2027-02-28");
  });
});

describe("acaoDoAdmin", () => {
  const base = { status: "ativa" as const, pagoAte: "2026-11-14", acessoLiberadoEm: null, acessoRevogadoEm: null };
  it("pago e sem acesso: liberar", () => {
    expect(acaoDoAdmin(base, "2026-10-20")).toBe("liberar");
  });
  it("com acesso e mês pago vencido: revogar", () => {
    expect(acaoDoAdmin({ ...base, status: "atrasada", acessoLiberadoEm: new Date() }, "2026-11-20")).toBe("revogar");
  });
  it("cancelada com mês ainda pago: nada a fazer até acabar", () => {
    expect(acaoDoAdmin({ ...base, status: "cancelada", acessoLiberadoEm: new Date() }, "2026-10-20")).toBeNull();
  });
  it("contestada com acesso: revogar já", () => {
    expect(acaoDoAdmin({ ...base, status: "contestada", acessoLiberadoEm: new Date() }, "2026-10-20")).toBe("revogar");
  });
  it("pendente: nada a fazer", () => {
    expect(acaoDoAdmin({ ...base, status: "pendente", pagoAte: null }, "2026-10-20")).toBeNull();
  });
});

describe("permitir", () => {
  it("barra a sexta tentativa na janela e libera depois", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) expect(permitir("1.2.3.4", 5, 60_000, t0 + i)).toBe(true);
    expect(permitir("1.2.3.4", 5, 60_000, t0 + 10)).toBe(false);
    expect(permitir("1.2.3.4", 5, 60_000, t0 + 61_000)).toBe(true);
  });
});
