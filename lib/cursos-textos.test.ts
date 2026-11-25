import { describe, expect, it } from "vitest";
import { cursos } from "@/lib/content";
import { VALOR_ASSINATURA_CENTAVOS } from "@/lib/assinatura/regras";
import { PERGUNTAS_DA_TRILHA, dadosDaTrilha } from "@/lib/cursos-trilhas";

/* Os números que a /cursos escreve (2026-11-25) saem da vitrine e do valor
   cobrado: mudou um dos dois, o texto tem de mudar junto. */
type Curso = { nome: string; emBreve?: boolean };
const todos: readonly Curso[] = cursos.vitrine.linhas.flatMap((l): readonly Curso[] => l.cursos);
const publicados = todos.filter((c) => !c.emBreve).length;
const emBreve = todos.filter((c) => c.emBreve).length;

describe("textos da /cursos", () => {
  it("os números da capa e da FAQ batem com a vitrine", () => {
    const valores = cursos.hero.numeros.map((n) => n.valor);
    expect(valores).toContain(String(publicados));
    expect(valores).toContain(String(emBreve));
    const horas = cursos.assinatura.faq.itens.find((i) => i.pergunta.startsWith("Quantas horas"));
    expect(horas?.resposta).toContain(`${publicados} cursos publicados`);
    expect(horas?.resposta).toContain(`Outros ${emBreve}`);
  });

  it("todo curso do \"Para quem é\" existe na vitrine", () => {
    for (const area of cursos.paraQuem.areas) {
      for (const nome of area.cursos) expect(todos.some((c) => c.nome === nome), nome).toBe(true);
    }
  });

  it("a âncora por dia confere com o valor cobrado (média do ano)", () => {
    const porDiaCentavos = (VALOR_ASSINATURA_CENTAVOS * 12) / 365;
    expect(porDiaCentavos).toBeLessThan(170);
    expect(cursos.assinatura.porDia).toContain("R$ 1,70");
  });

  it("toda linha da vitrine tem página de trilha, com slug único e textos que cabem na busca", () => {
    const p = cursos.paginasTrilha;
    expect(p.itens.map((i) => i.linha).sort()).toEqual(cursos.vitrine.linhas.map((l) => l.titulo).sort());
    expect(new Set(p.itens.map((i) => i.slug)).size).toBe(p.itens.length);
    for (const i of p.itens) {
      expect(i.slug).toMatch(/^[a-z0-9-]+$/);
      expect(i.metaTitulo.length, i.metaTitulo).toBeLessThanOrEqual(60);
      const d = dadosDaTrilha(i.slug)!;
      const descricao = p.descricao(i.tema, d.cursos.length);
      expect(descricao.length, descricao).toBeGreaterThanOrEqual(110);
      expect(descricao.length, descricao).toBeLessThanOrEqual(165);
      expect(`${i.titulo} ${i.intro}`).not.toMatch(/[—–]/);
    }
  });

  it("as perguntas das páginas de trilha existem na FAQ da assinatura", () => {
    for (const pergunta of PERGUNTAS_DA_TRILHA) {
      expect(cursos.assinatura.faq.itens.some((i) => i.pergunta === pergunta), pergunta).toBe(true);
    }
  });
});
