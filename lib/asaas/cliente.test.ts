import { afterEach, describe, expect, it } from "vitest";
import { criarCliente, redigirCpfs } from "./cliente";

describe("redigirCpfs", () => {
  it("mascara CPF cru e pontuado", () => {
    expect(redigirCpfs('{"cpfCnpj":"52998224725"}')).toBe('{"cpfCnpj":"[cpf-redigido]"}');
    expect(redigirCpfs("CPF 529.982.247-25 inválido")).toBe("CPF [cpf-redigido] inválido");
  });
});

describe("falha fechada", () => {
  const original = process.env.ASAAS_URL_BASE;
  afterEach(() => {
    if (original === undefined) delete process.env.ASAAS_URL_BASE;
    else process.env.ASAAS_URL_BASE = original;
  });

  /* A garantia que protege a chave de produção do .env.local: sem a URL base
     explícita, NENHUMA chamada sai — nem para o Asaas real. */
  it("sem ASAAS_URL_BASE, recusa antes de qualquer requisição", async () => {
    delete process.env.ASAAS_URL_BASE;
    await expect(criarCliente({ nome: "X", email: "x@x.com", cpf: "52998224725", telefone: "11988887777" })).rejects.toThrow(
      "ASAAS_URL_BASE ausente",
    );
  });
});
