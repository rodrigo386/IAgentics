import { describe, expect, it } from "vitest";
import { bolsas, reforma } from "./content";
import { admin } from "./content-admin";
import { CAMPOS_BOLSAS, EVENTOS_BOLSAS, EVENTOS_CURSOS, EVENTOS_REFORMA, eventoValido, MOTIVOS_BOLSAS, MOTIVOS_REFORMA } from "./eventos";

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

describe("eventos da calculadora da Reforma (2026-11-27)", () => {
  it("são aceitos pelo endpoint e têm prefixo próprio", () => {
    expect(eventoValido("reforma_calculo")).toBe(true);
    expect(eventoValido("reforma_erro_email")).toBe(true);
    expect(eventoValido("reforma_erro_empresa")).toBe(false);
    expect(EVENTOS_REFORMA.every((e) => e.startsWith("reforma_"))).toBe(true);
    expect(EVENTOS_CURSOS.some((e) => e.startsWith("reforma_"))).toBe(false);
  });
  it("os motivos medidos são mensagens que o formulário sabe mostrar", () => {
    for (const m of MOTIVOS_REFORMA) expect(reforma.lead.erros[m], m).toBeTruthy();
  });
});
