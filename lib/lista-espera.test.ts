import { describe, expect, it } from "vitest";
import { validarInscricao } from "./lista-espera";

const valido = { nome: "Rodrigo Costa", email: "rodrigo@empresa.com.br", consentimento: true };

describe("validação da lista de espera", () => {
  it("aceita e normaliza: e-mail em minúsculas, nome sem espaços nas pontas", () => {
    const r = validarInscricao({ ...valido, nome: "  Rodrigo Costa  ", email: "  Rodrigo@Empresa.COM.BR " });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.dados).toEqual({ nome: "Rodrigo Costa", email: "rodrigo@empresa.com.br" });
  });

  /* A asserção que dá sentido ao módulo: o consentimento é a base legal do
     compartilhamento com o Pecege. Aceitar um POST sem ele gravaria dado
     pessoal sem amparo — e o checkbox do cliente não é garantia nenhuma,
     qualquer um pode postar direto na rota. */
  it("recusa sem consentimento, mesmo com nome e e-mail perfeitos", () => {
    expect(validarInscricao({ ...valido, consentimento: false })).toEqual({ ok: false, motivo: "consentimento" });
    expect(validarInscricao({ nome: valido.nome, email: valido.email })).toEqual({ ok: false, motivo: "consentimento" });
    // "true" string não é true: só o booleano vale.
    expect(validarInscricao({ ...valido, consentimento: "true" })).toEqual({ ok: false, motivo: "consentimento" });
  });

  it("recusa nome vazio ou de uma letra só", () => {
    for (const nome of ["", "   ", "R"]) {
      expect(validarInscricao({ ...valido, nome })).toEqual({ ok: false, motivo: "nome" });
    }
  });

  it("recusa e-mail malformado", () => {
    for (const email of ["", "rodrigo", "rodrigo@", "@empresa.com", "rodrigo@empresa", "a b@c.com"]) {
      expect(validarInscricao({ ...valido, email })).toEqual({ ok: false, motivo: "email" });
    }
  });

  it("aceita endereços válidos que regex curta costuma barrar à toa", () => {
    for (const email of ["nome+tag@empresa.com.br", "n.o.m.e@sub.dominio.io", "NOME@EMPRESA.COM"]) {
      expect(validarInscricao({ ...valido, email }).ok).toBe(true);
    }
  });

  it("payload nulo ou de outro tipo não explode", () => {
    expect(validarInscricao(null).ok).toBe(false);
    expect(validarInscricao(undefined).ok).toBe(false);
    expect(validarInscricao("texto").ok).toBe(false);
    expect(validarInscricao(42).ok).toBe(false);
  });
});
