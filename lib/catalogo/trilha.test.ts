import { describe, expect, it } from "vitest";
import { catalogo } from "@/lib/content";
import { recomendarTrilha, type CursoTrilha, type Respostas } from "./trilha";

const CURSOS: CursoTrilha[] = [
  { slug: "a0", nivel: 0, temas: ["rotina"] },
  { slug: "b0", nivel: 0, temas: ["dados"] },
  { slug: "c0", nivel: 0, temas: ["pessoas"] },
  { slug: "a1", nivel: 1, temas: ["dados"] },
  { slug: "b1", nivel: 1, temas: ["custos"] },
  { slug: "c1", nivel: 1, temas: ["dados", "custos"] },
  { slug: "d1", nivel: 1, temas: ["pessoas"] },
  { slug: "a2", nivel: 2, temas: ["dados"] },
  { slug: "b2", nivel: 2, temas: ["estrategia"] },
];

const base: Respostas = { momento: 1, objetivo: "dados", junto: "nenhum", alcance: 0, tamanho: 3 };

describe("recomendarTrilha", () => {
  it("fica no nível da pessoa, prioriza o objetivo e devolve na ordem do catálogo", () => {
    const r = recomendarTrilha(base, CURSOS);
    // Escolhidos por pontos (a1 e c1 casam com dados), exibidos na ordem da planilha.
    expect(r.map((i) => i.slug)).toEqual(["a1", "b1", "c1"]);
    expect(r[0].motivo).toBe("dados");
    // b1 não casa com nada: completa a trilha como base do nível.
    expect(r[1].motivo).toBeNull();
  });

  it("a habilidade de junto desempata depois do objetivo", () => {
    const r = recomendarTrilha({ ...base, junto: "pessoas" }, CURSOS);
    expect(r.map((i) => i.slug)).toEqual(["a1", "c1", "d1"]);
    expect(r[2].motivo).toBe("pessoas");
  });

  it("com alcance, inclui o nível seguinte e ordena por nível para estudar", () => {
    const r = recomendarTrilha({ ...base, alcance: 1, tamanho: 3 }, CURSOS);
    // a1, c1 e a2 casam com dados; o nível de base vem primeiro no estudo.
    expect(r.map((i) => i.slug)).toEqual(["a1", "c1", "a2"]);
  });

  it("nunca desce de nível nem passa do último", () => {
    const r = recomendarTrilha({ ...base, momento: 2, alcance: 1, tamanho: 9 }, CURSOS);
    expect(r.every((i) => CURSOS.find((c) => c.slug === i.slug)!.nivel === 2)).toBe(true);
    expect(r).toHaveLength(2);
  });

  it("o tamanho pedido limita a trilha", () => {
    expect(recomendarTrilha({ ...base, tamanho: 3 }, CURSOS)).toHaveLength(3);
    expect(recomendarTrilha({ ...base, momento: 0, tamanho: 9 }, CURSOS)).toHaveLength(3);
  });

  /* Com a lista real: cada combinação de respostas precisa render uma trilha
     do tamanho pedido — nenhum nível tem menos de 9 cursos — e só com slugs
     que existem, porque é isso que vai para o carrinho. */
  it("com o catálogo real, toda combinação rende uma trilha cheia de cursos válidos", () => {
    const validos = new Set(catalogo.cursos.map((c) => c.slug));
    const objetivos = ["rotina", "dados", "custos", "estrategia", "ia"] as const;
    const juntos = ["pessoas", "dados", "ia", "nenhum"] as const;
    for (const momento of [0, 1, 2, 3] as const)
      for (const objetivo of objetivos)
        for (const junto of juntos)
          for (const alcance of [0, 1] as const)
            for (const tamanho of [3, 6, 9] as const) {
              const r = recomendarTrilha({ momento, objetivo, junto, alcance, tamanho }, catalogo.cursos);
              expect(r).toHaveLength(tamanho);
              expect(new Set(r.map((i) => i.slug)).size).toBe(tamanho);
              for (const i of r) expect(validos.has(i.slug)).toBe(true);
            }
  });

  /* O defeito que motivou as cotas: com pontuação pura, os 8 cursos
     intermediários de custos ocupavam a trilha inteira e as respostas
     "junto" e "alcance" não mudavam nada na tela. Cada resposta tem que
     aparecer no resultado. */
  it("com o catálogo real, a habilidade de junto e o próximo nível aparecem na trilha", () => {
    const r = recomendarTrilha({ momento: 1, objetivo: "custos", junto: "pessoas", alcance: 1, tamanho: 6 }, catalogo.cursos);
    const nivel = (slug: string) => catalogo.cursos.find((c) => c.slug === slug)!.nivel;
    expect(r.filter((i) => i.motivo === "pessoas").length).toBe(2);
    expect(r.filter((i) => nivel(i.slug) === 2).length).toBe(2);
    expect(r.filter((i) => i.motivo === "custos").length).toBeGreaterThanOrEqual(3);
    // Ordem de estudo: o nível atual inteiro antes do próximo.
    expect(r.map((i) => nivel(i.slug))).toEqual([1, 1, 1, 1, 2, 2]);
  });

  it("com o catálogo real, quem quer IA recebe cursos de IA", () => {
    const r = recomendarTrilha({ momento: 2, objetivo: "ia", junto: "nenhum", alcance: 0, tamanho: 3 }, catalogo.cursos);
    expect(r.map((i) => i.slug)).toContain("imersao-de-agentes-de-ia");
    expect(r.filter((i) => i.motivo === "ia").length).toBeGreaterThanOrEqual(2);
  });
});
