import { describe, expect, it } from "vitest";
import { eventoValido } from "./eventos";

describe("eventoValido", () => {
  it("aceita só a lista fechada", () => {
    expect(eventoValido("cta_topo")).toBe(true);
    expect(eventoValido("formulario_ok")).toBe(true);
    expect(eventoValido("qualquer_coisa")).toBe(false);
    expect(eventoValido(42)).toBe(false);
    expect(eventoValido(undefined)).toBe(false);
  });
});
