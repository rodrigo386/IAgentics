import { describe, expect, it } from "vitest";
import { bolsas } from "./content";
import { admin } from "./content-admin";
import { CAMPOS_BOLSAS, EVENTOS_BOLSAS, EVENTOS_CURSOS, eventoValido, MOTIVOS_BOLSAS } from "./eventos";

describe("eventoValido", () => {
  it("aceita só a lista fechada", () => {
    expect(eventoValido("cta_topo")).toBe(true);
    expect(eventoValido("formulario_ok")).toBe(true);
    expect(eventoValido("bolsas_formulario_ok")).toBe(true);
    expect(eventoValido("bolsas_bloqueio_problema")).toBe(true);
    expect(eventoValido("bolsas_erro_email")).toBe(true);
    expect(eventoValido("bolsas_erro_inventado")).toBe(false);
    expect(eventoValido("qualquer_coisa")).toBe(false);
    expect(eventoValido(42)).toBe(false);
    expect(eventoValido(undefined)).toBe(false);
  });
});

describe("eventos da /bolsas (2026-11-23)", () => {
  it("os motivos medidos são os motivos que o formulário sabe explicar", () => {
    expect([...MOTIVOS_BOLSAS].sort()).toEqual(Object.keys(bolsas.formulario.erros).sort());
  });
  it("todo campo medido tem rótulo no painel", () => {
    for (const c of CAMPOS_BOLSAS) expect(admin.bolsas.dentro.bloqueios.campos[c]).toBeTruthy();
  });
  it("as etapas dos painéis só usam eventos da própria página", () => {
    const daBolsas = admin.bolsas.dentro.etapas.flatMap((e) => e.eventos);
    expect(daBolsas.every((e) => (EVENTOS_BOLSAS as readonly string[]).includes(e))).toBe(true);
    expect(EVENTOS_CURSOS.some((e) => e.startsWith("bolsas_"))).toBe(false);
  });
});
