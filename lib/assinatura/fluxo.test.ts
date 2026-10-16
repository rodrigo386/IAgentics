import { describe, expect, it } from "vitest";
import { etapaDoCliente, horasUteisEntre, prazoDeLiberacao } from "./fluxo";

/* Horários em São Paulo (UTC−3), escritos com o fuso para não depender da
   máquina que roda o teste. 2026-10-16 é sexta-feira. */
const sp = (iso: string) => new Date(`${iso}-03:00`);

describe("horasUteisEntre", () => {
  it("conta as horas de um dia útil", () => {
    expect(horasUteisEntre(sp("2026-10-15T10:00"), sp("2026-10-15T16:00"))).toBe(6);
  });
  it("pula o fim de semana: de sexta 18h a segunda 18h são 24 horas úteis", () => {
    expect(horasUteisEntre(sp("2026-10-16T18:00"), sp("2026-10-19T18:00"))).toBe(24);
  });
  it("pago no sábado só começa a contar na segunda", () => {
    expect(horasUteisEntre(sp("2026-10-17T11:00"), sp("2026-10-19T06:00"))).toBe(6);
  });
  it("fim antes do início dá zero", () => {
    expect(horasUteisEntre(sp("2026-10-16T12:00"), sp("2026-10-16T11:00"))).toBe(0);
  });
});

describe("prazoDeLiberacao", () => {
  const pago = sp("2026-10-15T09:00"); // quinta
  it("no prazo, vence logo e atrasado", () => {
    expect(prazoDeLiberacao(pago, sp("2026-10-15T20:00")).situacao).toBe("no-prazo");
    expect(prazoDeLiberacao(pago, sp("2026-10-16T05:00")).situacao).toBe("vence-logo");
    expect(prazoDeLiberacao(pago, sp("2026-10-16T10:00")).situacao).toBe("atrasado");
  });
  it("o fim de semana não estoura o prazo de quem pagou na sexta à noite", () => {
    expect(prazoDeLiberacao(sp("2026-10-16T20:00"), sp("2026-10-19T12:00")).situacao).toBe("no-prazo");
  });
});

describe("etapaDoCliente", () => {
  const base = { status: "ativa" as const, pagoAte: "2026-11-16", acessoLiberadoEm: null, acessoRevogadoEm: null };
  const hoje = "2026-10-20";
  it("cada situação cai na sua coluna", () => {
    expect(etapaDoCliente({ ...base, status: "pendente", pagoAte: null }, hoje)).toBe("pagamento");
    expect(etapaDoCliente(base, hoje)).toBe("liberar");
    expect(etapaDoCliente({ ...base, acessoLiberadoEm: new Date() }, hoje)).toBe("com-acesso");
    expect(etapaDoCliente({ ...base, status: "atrasada", acessoLiberadoEm: new Date() }, hoje)).toBe("atrasada");
    expect(etapaDoCliente({ ...base, status: "atrasada", pagoAte: "2026-10-10", acessoLiberadoEm: new Date() }, hoje)).toBe("revogar");
    expect(etapaDoCliente({ ...base, status: "cancelada", pagoAte: "2026-10-10", acessoLiberadoEm: new Date(), acessoRevogadoEm: new Date() }, hoje)).toBe("encerrada");
    expect(etapaDoCliente({ ...base, status: "falhou", pagoAte: null }, hoje)).toBe("encerrada");
  });
  it("cancelada que ainda tem mês pago continua com acesso", () => {
    expect(etapaDoCliente({ ...base, status: "cancelada", acessoLiberadoEm: new Date() }, hoje)).toBe("com-acesso");
  });
});
