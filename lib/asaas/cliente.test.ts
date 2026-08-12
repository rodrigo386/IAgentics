import { describe, expect, it } from "vitest";
import { redigirCpfs } from "./cliente";

// Fix round (review da Task 4, Important 2): o corpo de erro do Asaas pode
// ecoar o CPF enviado (endpoint /customers valida CPF) — redigirCpfs mascara
// isso antes do console.error em cliente.ts. Teste puro, sem rede/DB: a
// função só mexe em string.
describe("redigirCpfs", () => {
  it("mascara uma sequência de 11 dígitos crus em qualquer lugar do texto", () => {
    expect(redigirCpfs('{"errors":[{"description":"cpfCnpj 52998224725 inválido"}]}')).toBe(
      '{"errors":[{"description":"cpfCnpj [cpf-redigido] inválido"}]}',
    );
  });

  // Fix round 2 (F2): a regex original (\d{11}) não pegava o CPF pontuado —
  // exatamente o formato do CPF_VALIDO usado em assinatura.test.ts.
  it("mascara CPF pontuado (formato 000.000.000-00)", () => {
    expect(redigirCpfs("cpfCnpj inválido: 529.982.247-25")).toBe("cpfCnpj inválido: [cpf-redigido]");
  });

  it("mascara múltiplas ocorrências no mesmo texto", () => {
    expect(redigirCpfs("52998224725 e 11144477735")).toBe("[cpf-redigido] e [cpf-redigido]");
  });

  it("não mexe em texto sem 11 dígitos consecutivos", () => {
    expect(redigirCpfs("erro genérico do asaas, sem cpf aqui")).toBe("erro genérico do asaas, sem cpf aqui");
    expect(redigirCpfs("id do cliente: 123456")).toBe("id do cliente: 123456");
  });
});
