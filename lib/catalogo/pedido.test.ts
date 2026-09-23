import { describe, expect, it } from "vitest";
import { validarPedido, vencimentoEm } from "./pedido";

const VALIDOS = ["a", "b"];
const valido = {
  nome: "  Rodrigo Costa ",
  email: " Rodrigo@Empresa.COM.br ",
  telefone: "(11) 98888-7777",
  cpf: "529.982.247-25",
  slugs: ["a", "b"],
  consentimento: true,
};

describe("validarPedido", () => {
  it("aceita e normaliza", () => {
    expect(validarPedido(valido, VALIDOS)).toEqual({
      ok: true,
      dados: { nome: "Rodrigo Costa", email: "rodrigo@empresa.com.br", telefone: "11988887777", cpf: "52998224725", slugs: ["a", "b"] },
    });
  });

  /* O consentimento é a base legal do compartilhamento com o Pecege; só o
     booleano true vale, conferido aqui e não no checkbox. */
  it("recusa sem consentimento", () => {
    expect(validarPedido({ ...valido, consentimento: "true" }, VALIDOS)).toEqual({ ok: false, motivo: "consentimento" });
    expect(validarPedido({ ...valido, consentimento: undefined }, VALIDOS)).toEqual({ ok: false, motivo: "consentimento" });
  });

  it("recusa cada campo inválido com o motivo certo", () => {
    expect(validarPedido({ ...valido, nome: "R" }, VALIDOS)).toEqual({ ok: false, motivo: "nome" });
    expect(validarPedido({ ...valido, email: "sem-arroba" }, VALIDOS)).toEqual({ ok: false, motivo: "email" });
    expect(validarPedido({ ...valido, telefone: "1234" }, VALIDOS)).toEqual({ ok: false, motivo: "telefone" });
    expect(validarPedido({ ...valido, cpf: "529.982.247-24" }, VALIDOS)).toEqual({ ok: false, motivo: "cpf" });
  });

  it("recusa nome e e-mail longos demais", () => {
    expect(validarPedido({ ...valido, nome: "A".repeat(201) }, VALIDOS)).toEqual({ ok: false, motivo: "nome" });
    expect(validarPedido({ ...valido, nome: "A".repeat(200) }, VALIDOS).ok).toBe(true);
    const emailLongo = `${"a".repeat(250)}@x.co`;
    expect(validarPedido({ ...valido, email: emailLongo }, VALIDOS)).toEqual({ ok: false, motivo: "email" });
  });

  it("recusa carrinho vazio ou só com cursos inexistentes, e limpa duplicados", () => {
    expect(validarPedido({ ...valido, slugs: [] }, VALIDOS)).toEqual({ ok: false, motivo: "cursos" });
    expect(validarPedido({ ...valido, slugs: ["x"] }, VALIDOS)).toEqual({ ok: false, motivo: "cursos" });
    expect(validarPedido({ ...valido, slugs: "a" }, VALIDOS)).toEqual({ ok: false, motivo: "cursos" });
    const r = validarPedido({ ...valido, slugs: ["b", "b", "x"] }, VALIDOS);
    expect(r.ok && r.dados.slugs).toEqual(["b"]);
  });
});

describe("vencimentoEm", () => {
  it("conta a partir da data de São Paulo, não da UTC", () => {
    // 23h de 30/09 em São Paulo já é 01/10 em UTC.
    expect(vencimentoEm(3, new Date("2026-10-01T02:00:00Z"))).toBe("2026-10-03");
    expect(vencimentoEm(3, new Date("2026-09-22T15:00:00Z"))).toBe("2026-09-25");
  });
});
