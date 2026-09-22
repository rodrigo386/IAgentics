import { describe, expect, it } from "vitest";
import { validarCpf } from "./cpf";

describe("validarCpf", () => {
  it("aceita CPF válido, pontuado ou não, e devolve só os dígitos", () => {
    expect(validarCpf("529.982.247-25")).toBe("52998224725");
    expect(validarCpf("52998224725")).toBe("52998224725");
  });
  it("recusa dígito verificador errado, tamanho errado e sequência repetida", () => {
    expect(validarCpf("529.982.247-24")).toBeNull();
    expect(validarCpf("5299822472")).toBeNull();
    expect(validarCpf("111.111.111-11")).toBeNull();
  });
});
