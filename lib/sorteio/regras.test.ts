import { describe, expect, it } from "vitest";
import { sorteio } from "@/lib/content";
import { CADASTRO_FECHA, cadastroAberto, formatarNumero, validarCadastro } from "./regras";

const base = {
  nome: "Ana Souza",
  email: " Ana@Empresa.com ",
  whatsapp: "(11) 98888-7777",
  area: "Compras e Suprimentos",
  regulamento: true,
};

describe("cadastro do sorteio", () => {
  it("aceita o mínimo e normaliza e-mail e WhatsApp; empresa e cargo são opcionais", () => {
    const r = validarCadastro(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.dados).toMatchObject({ email: "ana@empresa.com", whatsapp: "11988887777", empresa: "", cargo: "", comunicacoes: false });
  });
  it("recusa cada campo obrigatório inválido", () => {
    expect(validarCadastro({ ...base, nome: "Ana" })).toEqual({ ok: false, motivo: "nome" });
    expect(validarCadastro({ ...base, email: "ana@" })).toEqual({ ok: false, motivo: "email" });
    expect(validarCadastro({ ...base, whatsapp: "1234" })).toEqual({ ok: false, motivo: "whatsapp" });
    expect(validarCadastro({ ...base, area: "Inventada" })).toEqual({ ok: false, motivo: "area" });
    expect(validarCadastro({ ...base, regulamento: "on" })).toEqual({ ok: false, motivo: "regulamento" });
  });
  it("todo motivo de recusa tem mensagem na página", () => {
    for (const m of ["nome", "email", "whatsapp", "area", "regulamento", "fechado", "limite", "falha"]) {
      expect(sorteio.formulario.erros[m]).toBeTruthy();
    }
  });
  it("o cadastro fecha às 18h de 26/11 (SP), como dizem a página e o regulamento", () => {
    expect(cadastroAberto(new Date("2026-11-26T17:59:00-03:00"))).toBe(true);
    expect(cadastroAberto(new Date("2026-11-26T18:01:00-03:00"))).toBe(false);
    expect(CADASTRO_FECHA.toISOString()).toBe("2026-11-26T21:00:00.000Z");
    const regulamento = sorteio.regulamento.flatMap((s) => s.paragrafos).join(" ");
    expect(regulamento).toContain("até as 18h de 26 de novembro de 2026");
    expect(sorteio.lead).toContain("26 de novembro");
  });
  it("o número tem quatro dígitos", () => {
    expect(formatarNumero(7)).toBe("0007");
    expect(formatarNumero(12345)).toBe("12345");
  });
  it("os textos seguem as regras de escrita (sem travessão)", () => {
    expect(JSON.stringify(sorteio)).not.toMatch(/—/);
  });
});
