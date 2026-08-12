import { describe, expect, it } from "vitest";
import { validarCpf } from "./cpf";

describe("validarCpf", () => {
  it("aceita CPF válido com pontuação e devolve só dígitos", () => {
    expect(validarCpf("529.982.247-25")).toBe("52998224725");
  });
  it("aceita CPF válido sem pontuação", () => {
    expect(validarCpf("52998224725")).toBe("52998224725");
  });
  it("rejeita dígitos repetidos (passam na conta do DV, mas são inválidos)", () => {
    expect(validarCpf("111.111.111-11")).toBeNull();
  });
  it("rejeita tamanho errado", () => {
    expect(validarCpf("5299822472")).toBeNull();
    expect(validarCpf("")).toBeNull();
  });
  it("rejeita dígito verificador errado", () => {
    expect(validarCpf("52998224726")).toBeNull();
  });
});
